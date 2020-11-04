import { runCommandTask } from 'src/lib'
import { verbose, schema, epilogue } from 'src/commands/dbCommands/options'

export const command = 'save [name..]'
export const description = 'Create a new migration'
export const builder = (yargs) => {
  yargs
    .positional('name', {
      default: 'migration',
      description: 'Name of the migration',
      type: 'string',
    })
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(epilogue())
}

export const handler = async ({
  name = 'migration',
  verbose = true,
  schema,
}) => {
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
          `--schema=${schema}`,
        ].filter(Boolean),
      },
    ],
    {
      verbose,
    }
  )
}
