import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/internal'

export const command = 'netlify [...commands]'
export const description = 'Build command for Netlify deploy'

export const builder = (yargs) => {
  yargs
    .option('build', {
      description: 'Build for production',
      type: 'boolean',
      default: 'true',
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

export const handler = async ({ build, prisma, dm: dataMigrate }) => {
  const paths = getPaths()

  let commandSet = []
  if (build) {
    commandSet.push('yarn rw build')
  }
  if (prisma) {
    commandSet.push('yarn rw prisma migrate deploy')
  }
  if (dataMigrate) {
    commandSet.push('yarn rw dataMigrate up')
  }

  execa(commandSet.join(' && '), {
    shell: true,
    stdio: 'inherit',
    cwd: paths.base,
    extendEnv: true,
    cleanup: true,
  })
}
