import terminalLink from 'terminal-link'

import { getPaths, runCommandTask } from 'src/lib'

export const command = 'save [name..]'
export const description = 'Create a new migration'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the migration',
      type: 'string',
      default: 'migration',
    })
    .option('verbose', {
      alias: 'v',
      default: true,
      description: 'Print more',
      type: 'boolean',
    })
    .option('schema', {
      alias: 's',
      default: true,
      description: 'Overwrite Prisma schema path',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-save'
      )}`
    )
}

export const handler = async ({ name = 'migration', verbose = true }) => {
  await runCommandTask(
    [
      {
        title: 'Creating database migration...',
        cmd: 'yarn prisma',
        args: [
          'migrate save',
          name.length && `--name "${name}"`,
          '--create-db',
          '--experimental',
          `--schema=${getPaths().api.dbSchema}`,
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
