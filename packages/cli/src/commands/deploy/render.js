import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '../../lib'

export const command = 'render <side> [...commands]'
export const description = 'Build command for Render deploy'
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
    .option('serve', {
      description: 'Run server for api in production',
      type: 'boolean',
      default: 'true',
    })
    .epilogue(
      `For more commands, options, and examples, see ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}`
    )
}

export const handler = async ({ side, prisma, dm: dataMigrate, serve }) => {
  const paths = getPaths()
  let commandSet = []
  if (side == 'api') {
    if (prisma) {
      commandSet.push('yarn rw prisma migrate deploy')
    }
    if (dataMigrate) {
      commandSet.push('yarn rw dataMigrate up')
    }
    if (serve) {
      commandSet.push('yarn rw serve api')
    }
  } else if (side == 'web') {
    commandSet.push('yarn')
    commandSet.push('yarn rw build web')
  }

  execa(commandSet.join(' && '), {
    shell: true,
    stdio: 'inherit',
    cwd: paths.base,
    extendEnv: true,
    cleanup: true,
  })
}
