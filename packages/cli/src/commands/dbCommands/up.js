import { runCommandTask, generateTempSchema } from 'src/lib'

export const command = 'up'
export const desc = 'Generate the Prisma client and apply migrations.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
}

export const handler = async ({ verbose }) => {
  const tempSchemaPath = generateTempSchema()

  await runCommandTask(
    [
      {
        title: 'Migrate database up...',
        cmd: 'prisma2',
        args: [
          'migrate up',
          '--experimental',
          '--create-db',
          `--schema=${tempSchemaPath}`,
        ],
      },
      {
        title: 'Generating the Prisma client...',
        cmd: 'prisma2',
        args: ['generate', `--schema=${tempSchemaPath}`],
      },
      {
        title: 'Cleaning up temp schema...',
        cmd: `rm ${tempSchemaPath}`,
      },
    ],
    { verbose }
  )
}
