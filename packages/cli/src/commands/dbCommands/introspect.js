import terminalLink from 'terminal-link'

import { getPaths, runCommandTask } from 'src/lib'

export const command = 'introspect'
export const description =
  'Introspect your database and generate models in ./api/prisma/schema.prisma, overwriting existing models'
export const builder = (yargs) => {
  yargs
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
