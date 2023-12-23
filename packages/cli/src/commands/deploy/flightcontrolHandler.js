import path from 'path'

import execa from 'execa'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import { getConfig } from '@redwoodjs/project-config'

import { getPaths } from '../../lib'
import { apiServerHandler } from '../serveApiHandler'

export async function handler({ side, serve, prisma, dm: dataMigrate }) {
  recordTelemetryAttributes({
    command: 'deploy flightcontrol',
    side,
    prisma,
    dataMigrate,
    serve,
  })

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
        port: getConfig().api?.port || 8911,
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
