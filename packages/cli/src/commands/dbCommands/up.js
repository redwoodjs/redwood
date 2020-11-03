import { runCommandTask } from 'src/lib'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'
import {
  increment,
  autoApprove,
  dbClient,
  verbose,
  schema,
  epilogue,
} from 'src/commands/dbCommands/options'

export const command = 'up [increment]'
export const description = 'Generate the Prisma client and apply migrations'
export const builder = (yargs) => {
  yargs
    .positional('increment', increment())
    .option('dbClient', dbClient())
    .option('autoApprove', autoApprove())
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(epilogue())
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
          `--schema=${schema}`,
        ].filter(Boolean),
      },
    ],
    { verbose }
  )

  if (success && dbClient) {
    await generatePrismaClient({ force: true, verbose })
  }
}
