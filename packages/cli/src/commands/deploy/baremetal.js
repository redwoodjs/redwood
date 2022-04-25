import fs from 'fs'
import path from 'path'

import toml from '@iarna/toml'
import boxen from 'boxen'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'
import c from '../../lib/colors'
import { configFilename } from '../setup/deploy/providers/baremetal'

const DEFAULT_BRANCH_NAME = ['main']
const SYMLINK_FLAGS = '-nsf'

export const command = 'baremetal [environment]'
export const description = 'Deploy to baremetal server(s)'

export const execaOptions = {
  cwd: path.join(getPaths().base),
  stdio: 'inherit',
  shell: true,
  cleanup: true,
}

export const builder = (yargs) => {
  yargs.positional('environment', {
    describe: 'The environment to deploy to',
    default: 'production',
    type: 'string',
  })

  yargs.option('first-run', {
    describe:
      'Set this flag the first time you deploy: starts server processes from scratch',
    default: false,
    type: 'boolean',
  })

  yargs.option('update', {
    describe: 'Update code to latest revision',
    default: true,
    type: 'boolean',
  })

  yargs.option('install', {
    describe: 'Run `yarn install`',
    default: true,
    type: 'boolean',
  })

  yargs.option('migrate', {
    describe: 'Run database migration tasks',
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
    default: new Date()
      .toISOString()
      .replace(/[:\-TZ]/g, '')
      .replace(/\.\d+$/, ''),
    type: 'string',
  })

  yargs.option('branch', {
    describe: 'The branch to deploy',
    type: 'string',
  })

  // TODO: Allow option to pass --sides and only deploy select sides instead of all, always

  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood Baremetal Deploy Reference',
      'https://redwoodjs.com/docs/cli-commands#deploy'
    )}\n`
  )
}

// Executes a single command via SSH connection, capturing the exit code of the
// process. Displays an error and will exit(1) if code is non-zero
const sshExec = async (ssh, sshOptions, task, path, command, args) => {
  const result = await ssh.execCommand(`${command} ${args.join(' ')}`, {
    cwd: path,
  })

  if (result.code !== 0) {
    console.error(c.error(`\nDeploy failed!`))
    console.error(
      c.error(`Error while running command \`${command} ${args.join(' ')}\`:`)
    )
    console.error(
      boxen(result.stderr, {
        padding: { top: 0, bottom: 0, right: 1, left: 1 },
        margin: 0,
        borderColor: 'red',
      })
    )
    process.exit(1)
  }
}

export const verifyServerConfig = (config) => {
  // is the repo's url set
  if (!config.repo) {
    throw new Error(
      '`repo` config option not set. See https://redwoodjs.com/docs/deployment/baremetal#deploytoml'
    )
  }
}

const commands = (yargs, ssh) => {
  // parse config and get server list
  const deployConfig = toml.parse(
    fs.readFileSync(path.join(getPaths().base, configFilename))
  )
  let envConfig

  if (deployConfig.servers[yargs.environment]) {
    envConfig = deployConfig.servers[yargs.environment]
  } else if (
    yargs.environment === 'production' &&
    Array.isArray(deployConfig.servers)
  ) {
    envConfig = deployConfig.servers
  } else {
    throw new Error(
      `No deploy servers found for environment "${yargs.environment}"`
    )
  }

  let servers = []
  let tasks = []

  // loop through each server in deploy.toml
  for (const serverConfig of envConfig) {
    const sshOptions = {
      host: serverConfig.host,
      username: serverConfig.username,
      password: serverConfig.password,
      privateKey: serverConfig.privateKey,
      passphrase: serverConfig.passphrase,
      agent: serverConfig.agentForward && process.env.SSH_AUTH_SOCK,
      agentForward: serverConfig.agentForward,
    }
    const deployBranch =
      yargs.branch || serverConfig.branch || DEFAULT_BRANCH_NAME
    const cmdPath = path.join(serverConfig.path, yargs.releaseDir)

    verifyServerConfig(serverConfig)

    tasks.push({
      title: 'Connecting...',
      task: () => ssh.connect(sshOptions),
    })

    // TODO: Add lifecycle hooks for running custom code before/after each
    // built-in task

    tasks.push({
      title: `Cloning \`${deployBranch}\` branch...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'git', [
          'clone',
          `--branch=${deployBranch}`,
          `--depth=1`,
          serverConfig.repo,
          yargs.releaseDir,
        ])
      },
      skip: () => !yargs.update,
    })

    tasks.push({
      title: `Symlink .env...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, cmdPath, 'ln', [
          SYMLINK_FLAGS,
          '../.env',
          '.env',
        ])
      },
      skip: () => !yargs.update,
    })

    tasks.push({
      title: `Installing dependencies...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, cmdPath, 'yarn', ['install'])
      },
      skip: () => !yargs.install,
    })

    tasks.push({
      title: `DB Migrations...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, cmdPath, 'yarn', [
          'rw',
          'prisma',
          'migrate',
          'deploy',
        ])
        await sshExec(ssh, sshOptions, task, cmdPath, 'yarn', [
          'rw',
          'prisma',
          'generate',
        ])
        await sshExec(ssh, sshOptions, task, cmdPath, 'yarn', [
          'rw',
          'dataMigrate',
          'up',
        ])
      },
      skip: () => !yargs.migrate || serverConfig?.migrate === false,
    })

    for (const side of serverConfig.sides) {
      tasks.push({
        title: `Building ${side}...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, cmdPath, 'yarn', [
            'rw',
            'build',
            side,
          ])
        },
        skip: () => !yargs.build,
      })
    }

    tasks.push({
      title: `Symlinking current release...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'ln', [
          SYMLINK_FLAGS,
          yargs.releaseDir,
          'current',
        ])
      },
      skip: () => !yargs.update,
    })

    // start/restart monitoring processes
    for (const process of serverConfig.processNames) {
      if (yargs.firstRun) {
        tasks.push({
          title: `Starting ${process} process for the first time...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'pm2', [
              'start',
              path.join('current', 'ecosystem.config.js'),
              '--only',
              process,
            ])
          },
          skip: () => !yargs.restart,
        })
        tasks.push({
          title: `Saving ${process} state for future startup...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'pm2', [
              'save',
            ])
          },
          skip: () => !yargs.restart,
        })
      } else {
        tasks.push({
          title: `Restarting ${process} process...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'pm2', [
              'restart',
              process,
            ])
          },
          skip: () => !yargs.restart,
        })
      }
    }

    // TODO: Add a process for cleaning up old deploys

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

export const handler = async (yargs) => {
  const { NodeSSH } = require('node-ssh')
  const ssh = new NodeSSH()

  try {
    const tasks = new Listr(commands(yargs, ssh), {
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
