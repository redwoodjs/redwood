import { runCommandTask } from 'src/lib'

export const command = 'down'
export const desc = 'Migrate your database down.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}
export const handler = async ({ verbose = true }) => {
  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'yarn prisma',
        args: ['migrate down', '--experimental'],
      },
    ],
    {
      verbose,
    }
  )
}
