import { runCommandTask } from 'src/lib'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'
import * as options from 'src/commands/dbCommands/options'

export const command = 'up [increment]'
export const description = 'Generate the Prisma client and apply migrations'
export const builder = (yargs) => {
  yargs
    .positional('increment', {
      description:
        'Number of forward migrations to apply. Defaults to the latest',
      type: 'number',
    })
    .option('dbClient', {
      default: true,
      description: 'Generate the Prisma client',
      type: 'boolean',
    })
    .option('autoApprove', {
      default: false,
      description: 'Skip interactive approval before migrating',
      type: 'boolean',
    })
    .option('verbose', options.verbose())
    .option('schema', options.schema())
    .epilogue(options.epilogue())
}

export const handler = async ({
  increment,
  autoApprove = false,
  verbose = true,
  dbClient = true,
  schema,
}) => {
  const success = await runCommandTask(
    [
      {
        title: 'Migrate database up...',
        cmd: 'yarn prisma',
        args: [
          'migrate up',
          increment && `${increment}`,
          '--experimental',
          '--create-db',
          autoApprove && '--auto-approve',
          schema && `--schema="${schema}"`,
        ].filter(Boolean),
      },
    ],
    { verbose }
  )

  if (success && dbClient) {
    await generatePrismaClient({ force: true, verbose, schema })
  }
}
