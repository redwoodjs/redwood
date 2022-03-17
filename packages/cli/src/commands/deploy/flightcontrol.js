import path from 'path'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { apiServerHandler } from '@redwoodjs/api-server'
import { getConfig } from '@redwoodjs/internal'

import { getPaths } from '../../lib'

export const command = 'flightcontrol <side>'
export const description =
  'Build, Migrate, and Serve command for Flightcontrol deploy'
export const builder = (yargs) => {
  yargs
    .positional('side', {
      choices: ['api', 'web'],
      description: 'select side to build',
      type: 'string',
    })
    .option('prisma', {
      description: 'Apply database migrations',
      type: 'boolean',
      default: 'true',
    })
    .option('serve', {
      description: 'Run server for api in production',
      type: 'boolean',
      default: 'false',
    })
    .option('data-migrate', {
      description: 'Migrate the data in your database',
      type: 'boolean',
      default: 'true',
      alias: 'dm',
    })
    .epilogue(
      `For more commands, options, and examples, see ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}`
    )
}

// Telemetry mem usage exceeds Render free plan limit for API service
// Because telemetryMiddleware is added to Yargs as middleware,
// we need to set env outside handler to correctly disable Telemetry
if (process.argv.slice(2).includes('api')) {
  process.env.REDWOOD_DISABLE_TELEMETRY = 1
}

export const handler = async ({ side, serve, prisma, dm: dataMigrate }) => {
  const rwjsPaths = getPaths()

  const execaConfig = {
    shell: true,
    stdio: 'inherit',
    cwd: rwjsPaths.base,
    extendEnv: true,
    cleanup: true,
  }

  async function runApiCommands() {
    if (serve) {
      console.log('\nStarting api...')
      await apiServerHandler({
        port: process.env.PORT,
        apiRootPath: '/',
      })
    } else {
      console.log('\nBuilding api...')
      execa.sync('yarn rw build api', execaConfig)

      prisma &&
        execa.sync(
          path.join(rwjsPaths.base, 'node_modules/.bin/prisma'),
          ['migrate', 'deploy', '--schema', `"${rwjsPaths.api.dbSchema}"`],
          execaConfig
        )
      dataMigrate && execa.sync('yarn rw dataMigrate up', execaConfig)
    }
  }

  async function runWebCommands() {
    execa.sync('yarn rw build web', execaConfig)
  }

  if (side === 'api') {
    runApiCommands()
  } else if (side === 'web') {
    console.log('\nBuilding web...')
    runWebCommands()
  } else {
    console.log('Error with arguments provided')
    // you broke something, which should be caught by Yargs
  }
}
