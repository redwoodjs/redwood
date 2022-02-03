import execa from 'execa'
import terminalLink from 'terminal-link'

import { apiServerHandler } from '@redwoodjs/api-server'
import { getConfig } from '@redwoodjs/internal'

import { getPaths } from '../../lib'

export const command = 'render <side>'
export const description = 'Build, Migrate, and Serve command for Render deploy'
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

export const handler = async ({ side, prisma, dm: dataMigrate }) => {
  const paths = getPaths()

  const execaConfig = {
    shell: true,
    stdio: 'inherit',
    cwd: paths.base,
    extendEnv: true,
    cleanup: true,
  }

  async function runApiCommands() {
    prisma && (await execa('yarn rw prisma migrate deploy', execaConfig))
    dataMigrate && (await execa('yarn rw dataMigrate up', execaConfig))
    await apiServerHandler({
      port: getConfig().api?.port || 8911,
      apiRootPath: '/',
    })
  }

  async function runWebCommands() {
    await execa('yarn install', execaConfig)
    await execa('yarn rw build web', execaConfig)
  }

  if (side === 'api') {
    runApiCommands()
  } else if (side === 'web') {
    console.log('\nRunning yarn install and building web...')
    runWebCommands()
  } else {
    console.log('Error with arguments provided')
    // you broke something, which should be caught by Yargs
  }
}
