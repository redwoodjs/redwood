import terminalLink from 'terminal-link'

import { runCommandTask } from 'src/lib'

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
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
