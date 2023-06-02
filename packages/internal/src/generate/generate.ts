#!/usr/bin/env node

import { getPaths } from '@redwoodjs/project-config'

import { generateGraphQLSchema } from './graphqlSchema'
import { generateTypeDefs } from './typeDefinitions'

export const generate = async () => {
  const { schemaPath, errors: generateGraphQLSchemaErrors } =
    await generateGraphQLSchema()
  const { typeDefFiles, errors: generateTypeDefsErrors } =
    await generateTypeDefs()
  return {
    files: [schemaPath, ...typeDefFiles].filter((x) => typeof x === 'string'),
    errors: [...generateGraphQLSchemaErrors, ...generateTypeDefsErrors],
  }
}

export const run = async () => {
  console.log('Generating...')
  console.log()

  const { files, errors } = await generate()
  const rwjsPaths = getPaths()

  for (const f of files) {
    console.log('-', f.replace(rwjsPaths.base + '/', ''))
  }
  console.log()

  if (errors.length === 0) {
    console.log('... done.')
    console.log()
    return
  }

  console.log('... done with errors.')

  for (const { message, error } of errors) {
    console.error(message)
    console.error(error)
    console.log()
  }
}

if (require.main === module) {
  run()
}
