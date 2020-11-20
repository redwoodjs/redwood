import { getPaths, runCommandTask } from 'src/lib'
import * as options from 'src/commands/dbCommands/options'

export const command = 'introspect'
export const description =
  'Introspect your database and generate models in ./api/prisma/schema.prisma, overwriting existing models'
export const builder = (yargs) => {
  yargs
    .option('verbose', options.verbose())
    .option('schema', options.schema())
    .epilogue(options.epilogue())
}

export const handler = async ({ verbose = true, schema }) => {
  return await runCommandTask(
    [
      {
        title: 'Introspecting your database...',
        cmd: 'yarn prisma',
        args: ['introspect', schema && `--schema="${schema}"`],
        opts: { cwd: getPaths().api.db },
      },
    ],
    {
      verbose,
    }
  )
}
