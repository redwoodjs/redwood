import { runCommandTask } from 'src/lib'

export const command = 'up'
export const desc = 'Generate the Prisma client and apply migrations.'
export const builder = {
  verbose: { type: 'boolean', default: false, alias: ['v'] },
}

export const handler = async ({ verbose }) => {
  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'yarn prisma2',
        args: ['migrate up', '--experimental'],
      },
    ],
    {
      title: 'Generating the Prisma client...',
      cmd: 'yarn prisma2',
      args: ['generate'],
    },
    { verbose }
  )
}
