#!/usr/bin/env node

import { getPaths } from '@redwoodjs/project-config'

import { generateGraphQLSchema } from './graphqlSchema'
import { generateTypeDefs } from './typeDefinitions'

export const generate = async () => {
  const { schemaPath, errors: generateGraphQLSchemaErrors } =
    await generateGraphQLSchema()
  const { typeDefs: typeDefsPaths, errors: generateTypeDefsErrors } =
    await generateTypeDefs()
  return {
    files: [schemaPath, ...typeDefsPaths].filter((x) => typeof x === 'string'),
    errors: [...generateGraphQLSchemaErrors, ...generateTypeDefsErrors],
  }
}

export const run = async () => {
  console.log()
  console.log('Generating...')
  console.log()

  const rwjsPaths = getPaths()
  const { files, errors } = await generate()
  for (const f of files) {
    console.log('-', f.replace(rwjsPaths.base + '/', ''))
  }

  console.log()
  console.log('... and done.')
  console.log()

  if (errors.length > 0) {
    // dos some parsing...
    for (const { message, error } of errors) {
      console.error(message)
      console.error(error)
      console.log()
    }
  }
}

if (require.main === module) {
  run()
}
