import { runCommandTask, generateTempSchema } from 'src/lib'

export const command = 'down'
export const desc = 'Migrate your database down.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}
export const handler = async ({ verbose }) => {
  const tempSchemaPath = generateTempSchema

  await runCommandTask(
    [
      {
        title: 'Migrate database down...',
        cmd: 'prisma2',
        args: ['migrate down', '--experimental', `--schema=${tempSchemaPath}`],
      },
    ],
    {
      verbose,
    }
  )
}
