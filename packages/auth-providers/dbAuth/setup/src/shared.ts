import fs from 'node:fs'
import path from 'node:path'

import { getDMMF, getSchema } from '@prisma/internals'

import { getPaths } from '@redwoodjs/cli-helpers'

export const libPath = getPaths().api.lib.replace(getPaths().base, '')
export const functionsPath = getPaths().api.functions.replace(
  getPaths().base,
  '',
)

export async function hasModel(name: string) {
  if (!name) {
    return false
  }

  // Support PascalCase, camelCase, kebab-case, UPPER_CASE, and lowercase model
  // names
  const modelName = name.replace(/[_-]/g, '').toLowerCase()
  const datamodel = await getSchema(getPaths().api.dbSchema)
  const schema = await getDMMF({ datamodel })

  for (const model of schema.datamodel.models) {
    if (model.name.toLowerCase() === modelName) {
      return true
    }
  }

  return false
}

export async function addModels(models: string) {
  const isDirectory = fs.statSync(getPaths().api.dbSchema).isDirectory()

  if (isDirectory) {
    fs.writeFileSync(path.join(getPaths().api.dbSchema, 'user.prisma'), models)
  } else {
    fs.appendFileSync(getPaths().api.dbSchema, models)
  }
}
