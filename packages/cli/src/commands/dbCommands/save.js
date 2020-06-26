import terminalLink from 'terminal-link'

import { runCommandTask } from 'src/lib'

export const command = 'save [name..]'
export const description = 'Create a new migration'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the migration',
      type: 'array',
    })
    .option('verbose', {
      alias: 'v',
      default: true,
      description: 'Print more',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-save'
      )}`
    )
}

export const handler = async ({ name, verbose = true }) => {
  await runCommandTask(
    [
      {
        title: 'Creating database migration...',
        cmd: 'yarn prisma',
        args: [
          'migrate save',
          name.length && `--name ${name}`,
          '--create-db',
          '--experimental',
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
