#!/usr/bin/env node

import { getPaths } from 'src/paths'

import { generateGraphQLSchema } from './graphqlSchema'
import { generateTypeDefs } from './typeDefinitions'

export const generate = async () => {
  const schemaPath = await generateGraphQLSchema()
  const typeDefs = await generateTypeDefs()
  return [schemaPath, ...typeDefs].filter(
    (x) => typeof x === 'string'
  ) as string[]
}

const run = async () => {
  console.log()
  console.log('Generating...')
  console.log()

  const rwjsPaths = getPaths()
  const files = await generate()
  for (const f of files) {
    console.log('-', f.replace(rwjsPaths.base + '/', ''))
  }

  console.log()
  console.log('... and done.')
}

if (require.main === module) {
  run()
}
