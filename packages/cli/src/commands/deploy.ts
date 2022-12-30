import execa from 'execa'
import terminalLink from 'terminal-link'
import { Argv } from 'yargs'

import { colors, getPaths } from '../lib'

export const command = 'deploy <target>'
export const description = 'Deploy your Redwood project'

export const builder = (yargs: Argv) =>
  yargs
    .commandDir('./deploy', {
      recurse: false,
    })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )

export const commonDeployOptions = (yargs: Argv) => {
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

export const buildAndMigratePrisma = async ({
  build,
  prisma,
  dm: dataMigrate,
}: {
  build: boolean
  prisma: boolean
  dm: boolean
}) => {
  const paths = getPaths()

  const commandSet = []
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

  console.log(colors.green(`\nRunning:\n`) + `${joinedCommands} \n`)

  return execa(joinedCommands, {
    shell: true,
    stdio: 'inherit',
    cwd: paths.base,
    extendEnv: true,
    cleanup: true,
  })
}
