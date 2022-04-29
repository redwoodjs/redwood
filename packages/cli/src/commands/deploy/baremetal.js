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

export const command = 'baremetal'
export const description = 'Deploy to baremetal server(s)'

export const execaOptions = {
  cwd: path.join(getPaths().base),
  stdio: 'inherit',
  shell: true,
  cleanup: true,
}

export const builder = (yargs) => {
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
    describe: 'Run database migration tasks',
    default: true,
    type: 'boolean',
  })

  yargs.option('build', {
    describe: 'Run build process for the deployed `sides`',
    default: true,
    type: 'boolean',
  })

  yargs.option('symlink', {
    describe: 'Symlink web/dist to web/serve/current for zero-downtime deploys',
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

const commands = (yargs, ssh) => {
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

    // TODO: Add a `preInstall` step for executing arbitrary scripts after everything else

    // TODO: add ability to have a different strategy, like a full clone
    tasks.push({
      title: `Updating codebase...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'git', ['pull'])
      },
      skip: () => !yargs.pull,
    })

    tasks.push({
      title: `Installing dependencies...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
          'install',
        ])
      },
      skip: () => !yargs.install,
    })

    tasks.push({
      title: `DB Migrations...`,
      task: async (_ctx, task) => {
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'prisma',
          'migrate',
          'deploy',
        ])
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'prisma',
          'generate',
        ])
        await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
          'rw',
          'dataMigrate',
          'up',
        ])
      },
      skip: () => !yargs.migrate || serverConfig?.migrate === false,
    })

    // build sides
    for (const side of serverConfig.sides) {
      tasks.push({
        title: `Building ${side}...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
            'rw',
            'build',
            side,
          ])
        },
        skip: () => !yargs.build,
      })
    }

    // symlink web dist dir
    if (serverConfig.symlinkWeb) {
      tasks.push({
        title: `Symlinking web/serve/current...`,
        task: async (_ctx, task) => {
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'cp', [
            '-r',
            'web/dist',
            `web/serve/${yargs.releaseDir}`,
          ])
          await sshExec(ssh, sshOptions, task, serverConfig.path, 'ln', [
            '-nsf',
            yargs.releaseDir,
            'web/serve/current',
          ])
        },
        skip: () => !yargs.symlink,
      })

      // TODO: add process for cleaning up old deploys
    }

    // start/restart monitoring processes
    for (const process of serverConfig.processNames) {
      if (yargs.firstRun) {
        tasks.push({
          title: `Starting ${process} process for the first time...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
              'pm2',
              'start',
              'ecosystem.config.js',
              '--only',
              process,
            ])
          },
          skip: () => !yargs.restart,
        })
        tasks.push({
          title: `Saving ${process} state for future startup...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
              'pm2',
              'save',
            ])
          },
          skip: () => !yargs.restart,
        })
      } else {
        tasks.push({
          title: `Restarting ${process} process...`,
          task: async (_ctx, task) => {
            await sshExec(ssh, sshOptions, task, serverConfig.path, 'yarn', [
              'pm2',
              'restart',
              process,
            ])
          },
          skip: () => !yargs.restart,
        })
      }
    }

    // TODO: Add a `postInstall` step for executing arbitrary scripts after everything else

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
