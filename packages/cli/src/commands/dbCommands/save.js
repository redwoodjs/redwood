import { runCommandTask } from 'src/lib'

export const command = 'save [name..]'
export const desc = 'Create a new migration.'
export const builder = {
  verbose: { type: 'boolean', default: false, alias: ['v'] },
}
export const handler = async ({ name, verbose }) => {
  await runCommandTask(
    [
      {
        title: 'Migrating database up...',
        cmd: 'yarn prisma2',
        args: ['migrate save', name && `--name ${name}`, '--experimental'],
      },
    ],
    {
      verbose,
    }
  )
}
