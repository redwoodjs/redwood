import fs from 'node:fs'

import { getPaths } from './project'

const skipTask = (schema = getPaths().api.dbSchema) => {
  if (!fs.existsSync(schema)) {
    console.log(
      `Skipping database and Prisma client generation, no \`schema.prisma\` file found: \`${schema}\``
    )
    return true
  }
  return false
}

export const generatePrismaCommand = (schema: string) => {
  if (skipTask(schema)) {
    return {}
  }

  return {
    cmd: `node "${require.resolve('prisma/build/index.js')}"`,
    args: ['generate', schema && `--schema="${schema}"`],
  }
}
