import { runCommandTask } from 'src/lib'
import * as options from 'src/commands/dbCommands/options'

export const command = 'down [decrement]'
export const description = 'Migrate your database down'
export const builder = (yargs) => {
  yargs
    .positional('decrement', {
      default: 1,
      description: 'Number of backwards migrations to apply',
      type: 'number',
    })
    .option('verbose', options.verbose())
    .option('schema', options.schema())
    .epilogue(options.epilogue())
}
export const handler = async ({ decrement, verbose = true, schema }) => {
  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'yarn prisma',
        args: [
          'migrate down',
          decrement && `${decrement}`,
          '--experimental',
          schema && `--schema=${schema}`,
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
