// helper used in Dev and Build commands

import fs from 'fs'
import path from 'path'

import { runCommandTask, getPaths } from '../lib'

/**
 * Conditionally generate the prisma client, skip if it already exists.
 */
export const generatePrismaClient = async ({
  verbose = true,
  force = true,
  schema = getPaths().api.dbSchema,
}) => {
  if (!fs.existsSync(schema)) {
    console.log(
      `Skipping database and Prisma client generation, no \`schema.prisma\` file found: \`${schema}\``
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
        args: ['generate', schema && `--schema="${schema}"`],
      },
    ],
    {
      verbose,
    }
  )
}
