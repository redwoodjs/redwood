import { getPaths, runCommandTask } from 'src/lib'
import { verbose, schema, epilogue } from 'src/commands/dbCommands/options'

export const command = 'introspect'
export const description =
  'Introspect your database and generate models in ./api/prisma/schema.prisma, overwriting existing models'
export const builder = (yargs) => {
  yargs
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(epilogue())
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
