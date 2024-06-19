import fs from 'node:fs'

import { getDMMF } from '@prisma/internals'

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

  const schema = await getDMMF({ datamodelPath: getPaths().api.dbSchema })

  for (const model of schema.datamodel.models) {
    if (model.name.toLowerCase() === modelName) {
      return true
    }
  }

  return false
}

export function addModels(models: string) {
  const schema = fs.readFileSync(getPaths().api.dbSchema, 'utf-8')

  const schemaWithUser = schema + models

  fs.writeFileSync(getPaths().api.dbSchema, schemaWithUser)
}
