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
const CURRENT_RELEASE_SYMLINK_NAME = 'current'

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

  yargs.option('cleanup', {
    describe: 'Remove old deploy directories',
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

  yargs.option('maintenance', {
    describe: 'Add/remove the maintenance page',
    choices: ['up', 'down'],
    help: 'Put up a maintenance page by replacing the content of web/dist/index.html with the content of web/src/maintenance.html',
  })

  yargs.option('rollback', {
    describe: 'Add/remove the maintenance page',
    help: 'Rollback [count] number of releases',
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
  let sshCommand = command

  if (args) {
    sshCommand += ` ${args.join(' ')}`
  }

  const result = await ssh.execCommand(sshCommand, {
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

  return result
}

export const verifyServerConfig = (config) => {
  // is the repo's url set
  if (!config.repo) {
    throw new Error(
      '`repo` config option not set. See https://redwoodjs.com/docs/deployment/baremetal#deploytoml'
    )
  }
}

const maintenanceTasks = (status, ssh, sshOptions, serverConfig) => {
  const deployPath = path.join(serverConfig.path, CURRENT_RELEASE_SYMLINK_NAME)

  if (status === 'up') {
    return [
      {
        title: `Enabling maintenance page...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, deployPath, 'mv', [
            path.join('web', 'dist', '200.html'),
            path.join('web', 'dist', '200.html.orig'),
          ])
          await sshExec(ssh, sshOptions, task, deployPath, 'ln', [
            SYMLINK_FLAGS,
            path.join('..', 'src', 'maintenance.html'),
            path.join('web', 'dist', '200.html'),
          ])
        },
      },
    ]
  } else if (status === 'down') {
    return [
      {
        title: `Disabling maintenance page...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, deployPath, 'mv', [
            path.join('web', 'dist', '200.html.orig'),
            path.join('web', 'dist', '200.html'),
          ])
        },
      },
    ]
  }
}

const rollbackTasks = (count, ssh, sshOptions, serverConfig) => {
  let rollbackCount = 1

  if (parseInt(count) === count) {
    rollbackCount = count
  }

  const tasks = [
    {
      title: `Rolling back ${rollbackCount} release(s)...`,
      task: async (_ctx, task) => {
        const currentLink = (
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'readlink', [
            '-f',
            'current',
          ])
        ).stdout
          .split('/')
          .pop()
        const dirs = (
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'ls', ['-t'])
        ).stdout
          .split('\n')
          .filter((dirs) => !dirs.match(/current/))

        const deployedIndex = dirs.indexOf(currentLink)
        const rollbackIndex = deployedIndex + rollbackCount

        if (dirs[rollbackIndex]) {
          console.info('Setting symlink')
          await symlinkCurrentCommand(
            dirs[rollbackIndex],
            ssh,
            sshOptions,
            task,
            serverConfig.path
          )
        } else {
          throw new Error(
            `Cannot rollback ${rollbackCount} release(s): ${
              dirs.length - dirs.indexOf(currentLink) - 1
            } previous release(s) available`
          )
        }
      },
    },
  ]

  for (const processName of serverConfig.processNames) {
    tasks.push({
      title: `Restarting ${processName} process...`,
      task: async (_ctx, task) => {
        await restartProcessCommand(
          processName,
          ssh,
          sshOptions,
          task,
          serverConfig.path
        )
      },
    })
  }

  return tasks
}

const symlinkCurrentCommand = async (dir, ssh, sshOptions, task, path) => {
  return await sshExec(ssh, sshOptions, task, path, 'ln', [
    SYMLINK_FLAGS,
    dir,
    CURRENT_RELEASE_SYMLINK_NAME,
  ])
}

const restartProcessCommand = async (
  processName,
  ssh,
  sshOptions,
  task,
  path
) => {
  return await sshExec(ssh, sshOptions, task, path, 'pm2', [
    'restart',
    processName,
  ])
}

const deployTasks = (yargs, ssh, sshOptions, serverConfig) => {
  const deployBranch =
    yargs.branch || serverConfig.branch || DEFAULT_BRANCH_NAME
  const cmdPath = path.join(serverConfig.path, yargs.releaseDir)
  const tasks = []

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
      await symlinkCurrentCommand(
        yargs.releaseDir,
        ssh,
        sshOptions,
        task,
        serverConfig.path
      )
    },
    skip: () => !yargs.update,
  })

  for (const processName of serverConfig.processNames) {
    if (yargs.firstRun) {
      tasks.push({
        title: `Starting ${processName} process for the first time...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'pm2', [
            'start',
            path.join(CURRENT_RELEASE_SYMLINK_NAME, 'ecosystem.config.js'),
            '--only',
            processName,
          ])
        },
        skip: () => !yargs.restart,
      })
      tasks.push({
        title: `Saving ${processName} state for future startup...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'pm2', [
            'save',
          ])
        },
        skip: () => !yargs.restart,
      })
    } else {
      tasks.push({
        title: `Restarting ${processName} process...`,
        task: async (_ctx, task) => {
          await restartProcessCommand(
            processName,
            ssh,
            sshOptions,
            task,
            serverConfig.path
          )
        },
        skip: () => !yargs.restart,
      })
    }
  }

  tasks.push({
    title: `Cleaning up old deploys...`,
    task: async (_ctx, task) => {
      // add 2 to skip `current` and start on the 6th release
      const fileStartIndex = (serverConfig.keepReleases || 5) + 2

      await sshExec(
        ssh,
        sshOptions,
        task,
        serverConfig.path,
        `ls -t | tail -n +${fileStartIndex} | xargs rm -rf`
      )
    },
    skip: () => !yargs.cleanup,
  })

  return tasks
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

    verifyServerConfig(serverConfig)

    tasks.push({
      title: 'Connecting...',
      task: () => ssh.connect(sshOptions),
    })

    if (yargs.maintenance) {
      tasks = tasks.concat(
        maintenanceTasks(yargs.maintenance, ssh, sshOptions, serverConfig)
      )
    } else if (yargs.rollback) {
      tasks = tasks.concat(
        rollbackTasks(yargs.rollback, ssh, sshOptions, serverConfig)
      )
    } else {
      tasks = tasks.concat(deployTasks(yargs, ssh, sshOptions, serverConfig))
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
