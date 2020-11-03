import fs from 'fs'
import path from 'path'

import { runCommandTask, getPaths } from 'src/lib'
import {
  force,
  verbose,
  schema,
  epilogue,
} from 'src/commands/dbCommands/options'

export const command = 'generate'
export const description = 'Generate the Prisma client'
export const builder = (yargs) => {
  yargs
    .option('force', force())
    .option('verbose', verbose())
    .option('schema', schema())
    .epilogue(epilogue())
}
export const handler = async ({ verbose = true, force = true, schema }) => {
  if (!fs.existsSync(getPaths().api.dbSchema)) {
    console.log(
      `Skipping database and Prisma client generation, no \`schema.prisma\` file found: \`${
        getPaths().api.dbSchema
      }\``
    )
    return
  }

  // Do not generate the Prisma client if it exists.
  if (!force) {
    // The Prisma client throws if it is not generated.
    try {
      // Import the client from the redwood apps node_modules path.
      const { PrismaClient } = require(path.join(
        getPaths().base,
        'node_modules/.prisma/client'
      ))
      // eslint-disable-next-line
      new PrismaClient()
      return // Client exists, so abort.
    } catch (e) {
      // Swallow your pain, and generate.
    }
  }

  return await runCommandTask(
    [
      {
        title: 'Generating the Prisma client...',
        cmd: 'yarn prisma',
        // The schema argument will be undefined when prisma generate is run automatically following prisma migrate up
        args: ['generate', `--schema=${schema ? schema : schema()}`],
      },
    ],
    {
      verbose,
    }
  )
}
