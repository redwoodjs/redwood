import { runCommandTask } from 'src/lib'

export const command = 'generate'
export const desc = 'Generate the Prisma client.'
export const builder = {
  verbose: { type: 'boolean', default: false, alias: ['v'] },
}
export const handler = async ({ verbose }) => {
  await runCommandTask(
    [
      {
        title: 'Generating the Prisma client...',
        cmd: 'yarn prisma2',
        args: ['generate'],
      },
    ],
    {
      verbose,
    }
  )
}
