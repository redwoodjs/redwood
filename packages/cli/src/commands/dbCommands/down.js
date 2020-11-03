import terminalLink from 'terminal-link'

import { runCommandTask, getPaths } from 'src/lib'
import { schema } from 'src/commands/dbCommands/options'

export const command = 'down [decrement]'
export const description = 'Migrate your database down'
export const builder = (yargs) => {
  yargs
    .positional('decrement', {
      default: 1,
      description: 'Number of backwards migrations to apply',
      type: 'number',
    })
    .option('verbose', {
      alias: 'v',
      default: true,
      description: 'Print more',
      type: 'boolean',
    })
    .option('schema', schema())
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-down'
      )}`
    )
}
export const handler = async ({ decrement, verbose = true }) => {
  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'yarn prisma',
        args: [
          'migrate down',
          decrement && `${decrement}`,
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
