import { runCommandTask } from 'src/lib'

export const command = 'down'
export const desc = 'Migrate your database down.'
export const builder = {
  verbose: { type: 'boolean', default: false, alias: ['v'] },
}
export const handler = async ({ verbose }) => {
  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'yarn prisma2',
        args: ['migrate down', '--experimental'],
      },
    ],
    {
      verbose,
    }
  )
}
