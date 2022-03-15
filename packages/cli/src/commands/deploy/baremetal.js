import fs from 'fs'
import path from 'path'

import toml from '@iarna/toml'
import boxen from 'boxen'
import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import { NodeSSH } from 'node-ssh'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'
import c from '../../lib/colors'
import { configFilename } from '../setup/deploy/providers/baremetal'

export const command = 'baremetal'
export const description = 'Deploy to baremetal server(s)'

const ssh = new NodeSSH()

export const execaOptions = {
  cwd: path.join(getPaths().base),
  stdio: 'inherit',
  shell: true,
  cleanup: true,
}

export const builder = (yargs) => {
  yargs.option('sides', {
    describe: 'Which Side(s) to deploy',
    choices: ['api', 'web'],
    default: ['api', 'web'],
    alias: 'side',
    type: 'array',
  })

  yargs.option('first-run', {
    describe:
      'Set this flag the first time you deploy: starts server processes from scratch',
    default: false,
    type: 'boolean',
  })

  yargs.option('pull', {
    describe: 'Pull latest code',
    default: true,
    type: 'boolean',
  })

  yargs.option('install', {
    describe: 'Run `yarn install`',
    default: true,
    type: 'boolean',
  })

  yargs.option('migrate', {
    describe: 'Whether or not to run database migration tasks',
    default: true,
    type: 'boolean',
  })

  yargs.option('build', {
    describe: 'Run build process for the deployed `sides`',
    default: true,
    type: 'boolean',
  })

  yargs.option('restart', {
    describe: 'Restart server processes',
    default: true,
    type: 'boolean',
  })

  yargs.option('releaseDir', {
    describe:
      'Directory to create for the latest release, defaults to timestamp',
    default: new Date().toISOString().replace(/[:\-T.Z]/g, ''),
    type: 'string',
  })

  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood Baremetal Deploy Reference',
      'https://redwoodjs.com/docs/cli-commands#deploy'
    )}\n`
  )
}

// Handles building/reloading each side
const sideProcessTasks = (side, yargs, config) => {
  const tasks = []

  tasks.push({
    title: `Building ${side}...`,
    task: async () => {
      await execa('yarn', ['rw', 'build', side], execaOptions)
    },
  })

  // if the web side is being served by something like nginx, do the symlink thing
  if (side === 'web' && !config.redwood_web_server) {
    tasks.push({
      title: `Symlinking ${side}/serve/current...`,
      task: async () => {
        await execa(
          'cp',
          ['-r', 'web/dist', `web/serve/${yargs.releaseDir}`],
          execaOptions
        )
        await execa(
          'ln',
          ['-nsf', yargs.releaseDir, 'web/serve/current'],
          execaOptions
        )
      },
    })
    // TODO: add process for cleaning up old deploys
  }

  // Restart processes. For sure if it's not the web side, otherwise only if
  // the deploy config says we're using Redwood to serve web
  if (side !== 'web' || config.redwood_web_server) {
    const command = yargs.firstRun ? 'start' : 'restart'

    // on first run, start processes
    tasks.push({
      title: `Starting ${side} processes...`,
      task: async () => {
        await execa(
          'yarn',
          ['pm2', command, 'ecosystem.config.js', '--only', side],
          execaOptions
        )
      },
    })
  }

  return tasks
}

const sshExec = async (sshOptions, task, path, command, args) => {
  await ssh.connect(sshOptions)

  await ssh.exec(command, args, {
    cwd: path,
    onStdout: async (chunk) => {
      task.output = chunk.toString('utf-8')
    },
    onStderr: (chunk) => {
      throw new Error(chunk.toString('utf-8'))
    },
  })

  await ssh.dispose()
}

const commands = (yargs) => {
  // parse config and get server list
  const deployConfig = toml.parse(
    fs.readFileSync(path.join(getPaths().base, configFilename))
  )

  const tasks = []

  for (const serverConfig of deployConfig.servers) {
    const sshOptions = {
      host: serverConfig.host,
      username: serverConfig.username,
      password: serverConfig.password,
      privateKey: serverConfig.privateKey,
      passphrase: serverConfig.passphrase,
      agent: serverConfig.agentForward && process.env.SSH_AUTH_SOCK,
      agentForward: serverConfig.agentForward,
    }

    tasks.push({
      title: `Pulling latest code...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, serverConfig.path, 'git', ['pull'])
      },
      skip: () => {
        if (!yargs.pull) {
          return 'Skipping'
        }
      },
    })

    tasks.push({
      title: `yarn install...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, serverConfig.path, 'yarn', ['install'])
      },
      skip: () => {
        if (!yargs.pull) {
          return 'Skipping'
        }
      },
    })

    // tasks.push({
    //   title: `[${serverConfig.host}] Hanging up...`,
    //   task: () => {
    //     ssh.end()
    //   },
    // })

    //   {
    //     title: 'yarn install...',
    //     task: async () => {
    //       await execa('yarn', ['install'], execaOptions)
    //     },
    //     skip: () => {
    //       if (!yargs.install) {
    //         return 'Skipping'
    //       }
    //     },
    //   },
    // ]

    // // If the server doesn't even support migrations via config, do not include
    // // in task list at all, otherwise show, but skip if --no-migrate is set
    // if (serverConfig.migrate !== false) {
    //   tasks.push({
    //     title: 'Migrating database...',
    //     task: async () => {
    //       await execa('yarn', ['rw', 'prisma', 'migrate', 'deploy'], execaOptions)
    //       await execa('yarn', ['rw', 'prisma', 'generate'], execaOptions)
    //       await execa('yarn', ['rw', 'dataMigrate', 'up'], execaOptions)
    //     },
    //     skip: () => {
    //       if (!yargs.migrate) {
    //         return 'Skipping'
    //       }
    //     },
    //   })
    // }

    // for (const side of yargs.sides) {
    //   tasks = tasks.concat(sideProcessTasks(side, yargs, serverConfig))
    // }
  }

  return tasks
}

export const handler = async (yargs) => {
  try {
    const tasks = new Listr(commands(yargs), {
      exitOnError: true,
      renderer: yargs.verbose && VerboseRenderer,
    })
    await tasks.run()
  } catch (e) {
    console.error(c.error('\nDeploy failed:'))
    console.error(
      boxen(e.stderr || e.message, {
        padding: { top: 0, bottom: 0, right: 1, left: 1 },
        margin: 0,
        borderColor: 'red',
      })
    )

    process.exit(e?.exitCode || 1)
  }
}
