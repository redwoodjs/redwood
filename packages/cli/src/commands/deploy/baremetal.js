import fs from 'fs'
import path from 'path'

import toml from '@iarna/toml'
import boxen from 'boxen'
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

const sshExec = async (sshOptions, task, path, command, args) => {
  await ssh.exec(command, args, {
    cwd: path,
    onStdout: async (chunk) => {
      task.output = chunk.toString('utf-8')
    },
    onStderr: (chunk) => {
      console.error(c.error(`\nDeploy failed!`))
      console.error(
        c.error(`Error while running command \`${command} ${args.join(' ')}\`:`)
      )
      console.error(
        boxen(chunk.toString('utf-8'), {
          padding: { top: 0, bottom: 0, right: 1, left: 1 },
          margin: 0,
          borderColor: 'red',
        })
      )
      process.exit(1)
    },
  })
}

const commands = (yargs) => {
  // parse config and get server list
  const deployConfig = toml.parse(
    fs.readFileSync(path.join(getPaths().base, configFilename))
  )

  let servers = []
  let tasks = []

  // loop through each server in deploy.toml
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
      title: 'Connecting...',
      task: () => ssh.connect(sshOptions),
    })

    tasks.push({
      title: `Updating codebase...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, serverConfig.path, 'git', ['pull'])
      },
      skip: () => !yargs.pull,
    })

    tasks.push({
      title: `Installing dependencies...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, serverConfig.path, 'yarn', ['install'])
      },
      skip: () => !yargs.install,
    })

    tasks.push({
      title: `DB Migrations...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'prisma',
          'migrate',
          'deploy',
        ])
        await sshExec(sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'prisma',
          'generate',
        ])
        await sshExec(sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'dataMigrate',
          'up',
        ])
      },
      skip: () => !yargs.migrate || serverConfig?.migrate === false,
    })

    // build & start/restart processes
    for (const side of yargs.sides) {
      if (serverConfig.sides.includes(side)) {
        tasks = tasks.concat(
          sideProcessTasks(side, yargs, serverConfig, sshOptions)
        )
      }
    }

    tasks.push({
      title: 'Disconnecting...',
      task: () => ssh.dispose(),
    })

    // Sets each server as a "parent" task so that the actual deploy tasks
    // run as children. Each server deploy can run concurrently
    servers.push({
      title: serverConfig.host,
      task: () => {
        return new Listr(tasks)
      },
    })
  }

  return servers
}

// Handles building/reloading each side
const sideProcessTasks = (side, yargs, config, sshOptions) => {
  const tasks = []

  tasks.push({
    title: `Building ${side}...`,
    task: async (_ctx, task) => {
      await sshExec(sshOptions, task, config.path, 'yarn', [
        'rw',
        'build',
        side,
      ])
    },
  })

  // if the web side is being served by something like nginx, do the symlink thing
  // otherwise this will continue and run `yarn pm2 restart web` instead
  if (side === 'web' && !config.redwood_web_server) {
    tasks.push({
      title: `Symlinking ${side}/serve/current...`,
      task: async (_ctx, task) => {
        await sshExec(sshOptions, task, config.path, 'cp', [
          '-r',
          'web/dist',
          `web/serve/${yargs.releaseDir}`,
        ])
        await sshExec(sshOptions, task, config.path, 'ln', [
          '-nsf',
          yargs.releaseDir,
          'web/serve/current',
        ])
      },
    })
    // TODO: add process for cleaning up old deploys
  }

  // Restart processes. For sure if it's not the web side, otherwise only if
  // the deploy config says we're using Redwood to serve web
  if (side !== 'web' || config.redwood_web_server) {
    if (yargs.firstRun) {
      tasks.push({
        title: `Starting ${side} process for the first time...`,
        task: async (_ctx, task) => {
          await sshExec(sshOptions, task, config.path, 'yarn', [
            'pm2',
            'start',
            'ecosystem.config.js',
            '--only',
            side,
          ])
        },
      })
    } else {
      tasks.push({
        title: `Restarting ${side} process...`,
        task: async (_ctx, task) => {
          await sshExec(sshOptions, task, config.path, 'yarn', [
            'pm2',
            'restart',
            side,
          ])
        },
      })
    }
  }

  return tasks
}

export const handler = async (yargs) => {
  try {
    const tasks = new Listr(commands(yargs), {
      concurrent: true,
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
