import { runCommandTask } from 'src/lib'
import {
  decrement,
  verbose,
  schema,
  epilogue,
} from 'src/commands/dbCommands/options'

export const command = 'down [decrement]'
export const description = 'Migrate your database down'
export const builder = (yargs) => {
  yargs
    .positional('decrement', decrement())
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(epilogue())
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
          `--schema=${schema}`,
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
