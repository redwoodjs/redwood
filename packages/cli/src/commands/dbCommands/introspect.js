import terminalLink from 'terminal-link'

import { getPaths, runCommandTask } from 'src/lib'
import { verbose, schema } from 'src/commands/dbCommands/options'

export const command = 'introspect'
export const description =
  'Introspect your database and generate models in ./api/prisma/schema.prisma, overwriting existing models'
export const builder = (yargs) => {
  yargs
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-introspect'
      )}`
    )
}

export const handler = async ({ verbose = true }) => {
  return await runCommandTask(
    [
      {
        title: 'Introspecting your database...',
        cmd: 'yarn prisma',
        args: ['introspect', `--schema=${getPaths().api.dbSchema}`],
        opts: { cwd: getPaths().api.db },
      },
    ],
    {
      verbose,
    }
  )
}
