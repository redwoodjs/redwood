import path from 'path'
import fs from 'fs'

import { runCommandTask, getPaths } from 'src/lib'
import * as options from 'src/commands/dbCommands/options'
import c from 'src/lib/colors'

export const command = 'studio'
export const description = 'Start Prisma Studio'

export const builder = (yargs) => {
  yargs.option('schema', options.schema()).epilogue(options.epilogue())
}

export const handler = async ({ schema }) => {
  // No schema, no studio.
  if (!fs.existsSync(schema)) {
    console.log(
      `${c.warning(
        '[warning]'
      )} cannot start Prisma Studio; schema missing (${c.info(
        // So we're not hard coding schema.prisma's relative location
        path.relative(getPaths().base, schema)
      )}).`
    )
    return
  }

  await runCommandTask(
    [
      {
        title: 'Starting Prisma Studio...',
        cmd: 'yarn prisma',
        args: ['studio', `--schema=${schema}`],
      },
    ],
    { verbose: true }
  )
}
