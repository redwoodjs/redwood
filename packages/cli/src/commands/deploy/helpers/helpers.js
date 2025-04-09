import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/project-config'

import c from '../../../lib/colors.js'

export const deployBuilder = (yargs) => {
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
        'https://redwoodjs.com/docs/cli-commands#deploy',
      )}`,
    )
}

export const deployHandler = async ({ build, prisma, dm: dataMigrate }) => {
  const paths = getPaths()

  let commandSet = []
  if (build) {
    commandSet.push('yarn rw build --verbose')
  }
  if (prisma) {
    commandSet.push('yarn rw prisma migrate deploy')
  }
  if (dataMigrate) {
    commandSet.push('yarn rw data-migrate up')
  }

  const joinedCommands = commandSet.join(' && ')

  console.log(c.note(`\nRunning:\n`) + `${joinedCommands} \n`)

  return execa(joinedCommands, {
    shell: true,
    stdio: 'inherit',
    cwd: paths.base,
    extendEnv: true,
    cleanup: true,
  })
}
