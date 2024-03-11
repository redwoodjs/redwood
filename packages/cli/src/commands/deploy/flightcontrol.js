import path from 'path'

import execa from 'execa'
import fs from 'fs-extra'
import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getPaths } from '@redwoodjs/project-config'

export const command = 'flightcontrol <side>'
export const alias = 'fc'
export const description =
  'Build, Migrate, and Serve commands for Flightcontrol deploy'

export const builder = (yargs) => {
  yargs
    .positional('side', {
      choices: ['api', 'web'],
      description: 'Side to deploy',
      type: 'string',
    })
    .option('prisma', {
      description: 'Apply database migrations',
      type: 'boolean',
      default: true,
    })
    .option('serve', {
      description: 'Run server for api in production',
      type: 'boolean',
      default: false,
    })
    .option('data-migrate', {
      description: 'Apply data migrations',
      type: 'boolean',
      default: true,
      alias: 'dm',
    })
    .epilogue(
      `For more commands, options, and examples, see ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy',
      )}`,
    )
}

export const handler = async ({ side, serve, prisma, dm: dataMigrate }) => {
  recordTelemetryAttributes({
    command: 'deploy flightcontrol',
    side,
    prisma,
    dataMigrate,
    serve,
  })
  const rwjsPaths = getPaths()

  const execaConfig = {
    cwd: rwjsPaths.base,
    shell: true,
    stdio: 'inherit',
  }

  async function runApiCommands() {
    if (!serve) {
      console.log('Building api...')
      execa.commandSync('yarn rw build api --verbose', execaConfig)

      if (prisma) {
        console.log('Running database migrations...')
        execa.commandSync(
          `node_modules/.bin/prisma migrate deploy --schema "${rwjsPaths.api.dbSchema}"`,
          execaConfig,
        )
      }

      if (dataMigrate) {
        console.log('Running data migrations...')
        execa.commandSync('yarn rw dataMigrate up', execaConfig)
      }

      return
    }

    const serverFilePath = path.join(rwjsPaths.api.dist, 'server.js')
    const hasServerFile = fs.pathExistsSync(serverFilePath)

    if (hasServerFile) {
      execa(`yarn node ${serverFilePath}`, execaConfig)
    } else {
      const { handler } = await import(
        '@redwoodjs/api-server/dist/apiCLIConfigHandler.js'
      )
      handler()
    }
  }

  async function runWebCommands() {
    console.log('Building web...')
    execa.commandSync('yarn rw build web --verbose', execaConfig)
  }

  if (side === 'api') {
    runApiCommands()
  } else if (side === 'web') {
    runWebCommands()
  }
}
