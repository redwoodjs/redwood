import fs from 'fs'
import path from 'path'

import toml from '@iarna/toml'
import boxen from 'boxen'
import chalk from 'chalk'
import { config } from 'dotenv-defaults'
import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import prompts from 'prompts'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'
import c from '../../lib/colors'
import { configFilename } from '../setup/deploy/providers/baremetal'

export const command = 'baremetal'
export const description = 'Deploy to baremetal server(s)'

export const execaOptions = {
  cwd: path.join(getPaths().base),
  stdio: 'pipe',
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

  yargs.option('deploy', {
    describe:
      'This flag is set when this command runs on the server to actually deploy (should not be set manually)',
    default: -1,
    type: 'number',
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

const clientCommands = (yargs) => {
  const flags = []
  if (yargs.firstRun) {
    flags.push('--first-run')
  }
  if (!yargs.pull) {
    flags.push('--no-pull')
  }
  if (!yargs.install) {
    flags.push('--no-install')
  }
  if (!yargs.migrate) {
    flags.push('--no-migrate')
  }
  if (!yargs.build) {
    flags.push('--no-build')
  }
  if (!yargs.restart) {
    flags.push('--no-restart')
  }
  // sides will be configured right at deploy time depending on deploy.toml

  // parse config and get server list
  const deployConfig = toml.parse(
    fs.readFileSync(path.join(getPaths().base, configFilename))
  )

  const rwDeployCommand = ['yarn', 'rw', 'deploy', 'baremetal', ...flags]

  // run the remote deploy command on each server
  const tasks = []
  let index = 0

  for (const serverConfig of deployConfig.servers) {
    const deploySides = yargs.sides.filter((side) =>
      serverConfig.sides.includes(side)
    )

    if (!deploySides.length) {
      console.info(
        `Server ${serverConfig.connect} has no deployable sides, skipping...`
      )
      continue
    }

    const sshDeployCommand = [
      ...rwDeployCommand,
      `--deploy=${index}`,
      ...deploySides.map((side) => `--sides=${side}`),
    ]

    console.info(sshDeployCommand)

    tasks.push({
      title: `Deploying ${serverConfig.sides} to ${serverConfig.connect}...`,
      task: async () => {
        await execa(
          'ssh',
          [
            serverConfig.connect,
            '-o',
            `ConnectTimeout=${serverConfig.timeout || 5}`,
            `"cd ${serverConfig.path} && ${sshDeployCommand.join(' ')}"`,
          ],
          execaOptions
        )
      },
    })

    index++
  }

  return tasks
}

const serverCommands = (yargs) => {
  // parse config and get server list
  const deployConfig = toml.parse(
    fs.readFileSync(path.join(getPaths().base, configFilename))
  )
  const serverConfig = deployConfig.servers[yargs.deploy]

  // Is this a valid server config array index?
  if (!serverConfig) {
    throw new Error(
      `Invalid server index value: got index ${yargs.deploy}, deploy config only has ${deployConfig.servers.length} server(s) configured`
    )
  }

  // Is this attempting to deploy to a side that this server does not support?
  // The client shouldn't have made this call at all, but in case someone is
  // messing around and rolling their own
  const deploySides = yargs.sides.filter((side) =>
    serverConfig.sides.includes(side)
  )

  if (!deploySides.length) {
    throw new Error(
      `Server is not configured for this deploy side, got ${JSON.stringify(
        yargs.sides
      )} but this server only handles ${JSON.stringify(serverConfig.sides)}`
    )
  }

  console.info(yargs)
  console.info(serverConfig)

  let tasks = [
    {
      title: 'Pulling latest code...',
      task: async () => {
        await execa('git', ['pull'], execaOptions)
      },
      skip: () => {
        if (!yargs.pull) {
          return 'Skipping'
        }
      },
    },
    {
      title: 'yarn install...',
      task: async () => {
        await execa('yarn', ['install'], execaOptions)
      },
      skip: () => {
        if (!yargs.install) {
          return 'Skipping'
        }
      },
    },
  ]

  // If the server doesn't even support migrations via config, do not include
  // in task list at all, otherwise show, but skip if --no-migrate is set
  if (serverConfig.migrate !== false) {
    tasks.push({
      title: 'Migrating database...',
      task: async () => {
        await execa('yarn', ['rw', 'prisma', 'migrate', 'deploy'], execaOptions)
        await execa('yarn', ['rw', 'prisma', 'generate'], execaOptions)
        await execa('yarn', ['rw', 'dataMigrate', 'up'], execaOptions)
      },
      skip: () => {
        if (!yargs.migrate) {
          return 'Skipping'
        }
      },
    })
  }

  for (const side of yargs.sides) {
    tasks = tasks.concat(sideProcessTasks(side, yargs, serverConfig))
  }

  return tasks
}

export const handler = async (yargs) => {
  try {
    if (yargs.deploy === -1) {
      const clientTasks = new Listr(clientCommands(yargs), {
        exitOnError: true,
        renderer: yargs.verbose && VerboseRenderer,
      })
      await clientTasks.run()
    } else {
      const serverTasks = new Listr(serverCommands(yargs), {
        exitOnError: true,
        renderer: yargs.verbose && VerboseRenderer,
      })
      await serverTasks.run()
    }
  } catch (e) {
    console.error(c.error('\nDeploy failed:'))
    console.error(
      boxen(e.stderr, {
        padding: { top: 0, bottom: 0, right: 1, left: 1 },
        margin: 0,
        borderColor: 'red',
      })
    )

    process.exit(e?.exitCode || 1)
  }
}
