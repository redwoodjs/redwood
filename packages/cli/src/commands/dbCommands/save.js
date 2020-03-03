import { runCommandTask, generateTempSchema } from 'src/lib'

export const command = 'save [name..]'
export const desc = 'Create a new migration.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}
export const handler = async ({ name, verbose }) => {
  const tempSchemaPath = generateTempSchema()

  await runCommandTask(
    [
      {
        title: 'Creating database migration...',
        cmd: 'prisma2',
        args: [
          'migrate save',
          `--name ${name}`,
          '--experimental',
          `--schema=${tempSchemaPath}`,
        ],
      },
      {
        title: 'Cleaning up temp schema...',
        cmd: `rm ${tempSchemaPath}`,
      },
    ],
    {
      verbose,
    }
  )
}
