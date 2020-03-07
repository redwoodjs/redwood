import { runCommandTask } from 'src/lib'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

export const command = 'up'
export const desc = 'Generate the Prisma client and apply migrations.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
  dbClient: { type: 'boolean', default: true },
}

export const handler = async ({ verbose, dbClient }) => {
  if (dbClient) {
    await generatePrismaClient({ force: true, verbose: true })
  }

  await runCommandTask(
    [
      {
        title: 'Migrate database up...',
        cmd: 'prisma2',
        args: ['migrate up', '--experimental', '--create-db'],
      },
    ],
    { verbose }
  )
}
