import path from 'path'

import { getDMMF } from '@prisma/sdk'
import pascalcase from 'pascalcase'

import { ensureUniquePlural } from './pluralHelpers'
import { singularize, isPlural } from './rwPluralize'

import { getPaths } from './'

/**
 * Used to memoize results from `getSchema` so we don't have to go through
 * the work of open the file and parsing it from scratch each time getSchema()
 * is called with the same model name.
 */
const schemaMemo = {}

/**
 * Checks if a model with the given name exists in schema.prisma
 */
const isExistingModel = async (name) => {
  if (!name) {
    return false
  }

  if (schemaMemo[name]) {
    return true
  }

  const schema = await getSchemaDefinitions()

  return schema.datamodel.models.some((model) => model.name === name)
}

/**
 * Returns the database schema for the given `name` database table parsed from
 * the schema.prisma of the target application. If no `name` is given then the
 * entire schema is returned.
 */
export const getSchema = async (name) => {
  if (name) {
    if (!schemaMemo[name]) {
      const schema = await getSchemaDefinitions()
      const model = schema.datamodel.models.find((model) => {
        return model.name === name
      })

      if (model) {
        // look for any fields that are enums and attach the possible enum values
        // so we can put them in generated test files
        model.fields.forEach((field) => {
          const fieldEnum = schema.datamodel.enums.find((e) => {
            return field.type === e.name
          })
          if (fieldEnum) {
            field.enumValues = fieldEnum.values
          }
        })

        // memoize based on the model name
        schemaMemo[name] = model
      } else {
        throw new Error(
          `No schema definition found for \`${name}\` in schema.prisma file`
        )
      }
    }
    return schemaMemo[name]
  } else {
    return (await getSchemaDefinitions()).datamodel
  }
}

/**
 * Returns the enum defined with the given `name` parsed from
 * the schema.prisma of the target application. If no `name` is given then the
 * all enum definitions are returned
 */
export const getEnum = async (name) => {
  const schema = await getSchemaDefinitions()

  if (name) {
    const model = schema.datamodel.enums.find((model) => {
      return model.name === name
    })

    if (model) {
      return model
    } else {
      throw new Error(
        `No enum schema definition found for \`${name}\` in schema.prisma file`
      )
    }
  }

  return schema.metadata.datamodel.enums
}

/*
 * Returns the DMMF defined by `prisma` resolving the relevant `schema.prisma` path.
 */
export const getSchemaDefinitions = () => {
  const datamodelPath = path.join(getPaths().api.db, 'schema.prisma')

  return getDMMF({ datamodelPath })
}

export async function verifyModelName(options) {
  let modelName = undefined

  if (await isExistingModel(pascalcase(options.name))) {
    modelName = pascalcase(options.name)
  } else if (await isExistingModel(pascalcase(singularize(options.name)))) {
    modelName = pascalcase(singularize(options.name))
  }

  if (modelName === undefined) {
    throw new Error(
      `"${modelName}" model not found, check if it exists in "./api/db/schema.prisma"`
    )
  }

  await ensureUniquePlural({
    model: modelName,
    inDestroyer: options.isDestroyer,
    forcePrompt: isPlural(modelName),
  })

  return { ...options, name: modelName }
}
