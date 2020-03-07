import path from 'path'

import { runCommandTask, getPaths } from 'src/lib'

export const command = 'generate'
export const desc = 'Generate the Prisma client.'
export const builder = {
  verbose: { type: 'boolean', default: true, alias: ['v'] },
  force: { type: 'boolean', default: true, alias: ['f'] },
}
export const handler = async ({ verbose, force }) => {
  // Do not generate the prisma client if it exists exist. The
  // Prisma client throws when it's not generated.
  if (!force) {
    // We have to import from the redwood apps node_modules path.
    try {
      const { PrismaClient } = require(path.join(
        getPaths().base,
        'node_modules/@prisma/client'
      ))
      // eslint-disable-next-line no-new
      new PrismaClient()
      return undefined
    } catch (e) {
      // do nothing, the client already exists and we're not forcing generation.
    }
  }

  return await runCommandTask(
    [
      {
        title: 'Generating the Prisma client...',
        cmd: 'prisma2',
        args: ['generate'],
      },
    ],
    {
      verbose,
    }
  )
}
