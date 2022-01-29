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
  let commandSet = []
  if (side === 'api') {
    if (prisma) {
      commandSet.push('yarn rw prisma migrate deploy')
    }
    if (dataMigrate) {
      commandSet.push('yarn rw dataMigrate up')
    }
  } else if (side === 'web') {
    commandSet.push('yarn')
    commandSet.push('yarn rw build web')
  }

  if (commandSet.length) {
    execa(commandSet.join(' && '), {
      shell: true,
      stdio: 'inherit',
      cwd: paths.base,
      extendEnv: true,
      cleanup: true,
    })
  }

  if (side === 'api') {
    apiServerHandler({
      port: getConfig().api?.port || 8911,
      apiRootPath: '/',
    })
  }
}
