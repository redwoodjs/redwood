import fs from 'fs'
import path from 'path'

import terminalLink from 'terminal-link'

import { runCommandTask, getPaths } from 'src/lib'

export const command = 'generate'
export const description = 'Generate the Prisma client'
export const builder = (yargs) => {
  yargs
    .option('force', {
      alias: 'f',
      default: true,
      description: 'Overwrite existing Client',
      type: 'boolean',
    })
    .option('verbose', {
      alias: 'v',
      default: true,
      description: 'Print more',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#db-generate'
      )}`
    )
}
export const handler = async ({ verbose = true, force = false }) => {
  const schemaExists = fs.existsSync(getPaths().api.dbSchema)

  // Do not generate the Prisma client if it exists.
  if (!force) {
    // The Prisma client throws if it is not generated.
    try {
      // Import the client from the redwood apps node_modules path.
      const { PrismaClient } = require(path.join(
        getPaths().base,
        'node_modules/.prisma/client'
      ))
      if (schemaExists) {
        // eslint-disable-next-line
        new PrismaClient()
      }
      return undefined
    } catch (e) {
      // Swallow your pain.
    }
  }

  return await runCommandTask(
    [
      {
        title: schemaExists
          ? 'Generating the Prisma client...'
          : 'Skipping Prisma Client: no schema.prisma found',
        cmd: schemaExists
          ? 'yarn prisma generate'
          : 'echo "no schema.prisma file found"',
      },
    ],
    {
      verbose,
    }
  )
}
