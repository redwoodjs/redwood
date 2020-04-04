import { runCommandTask } from 'src/lib'

export const command = 'fix'
export const desc = 'Fix database migration conflicts.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}
export const handler = async ({ verbose = true }) => {
  await runCommandTask(
    [
      {
        title: 'Fix Prisma migration conflicts...',
        cmd: 'yarn prisma',
        args: ['migrate fix', '--experimental'],
      },
    ],
    {
      verbose,
    }
  )
}
