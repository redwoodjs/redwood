import terminalLink from 'terminal-link'

import { runCommandTask } from 'src/lib'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

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
    .option('verbose', {
      alias: 'v',
      default: true,
      description: 'Print more',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-up'
      )}`
    )
}

export const handler = async ({
  increment,
  autoApprove = false,
  verbose = true,
  dbClient = true,
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
        ].filter(Boolean),
      },
    ],
    { verbose }
  )

  if (success && dbClient) {
    await generatePrismaClient({ force: true, verbose })
  }
}
