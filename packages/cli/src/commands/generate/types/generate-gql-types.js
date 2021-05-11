import { generate } from '@graphql-codegen/cli'

// We'll need this when we try to use makeMergedSchema
// import path from 'path'
// import { makeServices, makeMergedSchema } from '@redwoodjs/api'
// import babelRequireHook from '@babel/register'

// babelRequireHook({
//   extends: path.join(getPaths().api.base, '.babelrc.js'),
//   extensions: ['.js', '.ts', '.tsx', '.jsx'],
//   ignore: ['node_modules'],
//   cache: false,
// })

const GENERATOR_CONFIG = {
  // @TODO: Can't seem to get the glob imports working
  // It would be better to use this, because that way we don't need to run the API server

  // schema: makeMergedSchema({
  //   schemas: require(`${getPaths().api.base}/src/graphql/**/*.{js,ts}`),
  //   services: makeServices({
  //     services: require(`${getPaths().api.base}/src/services/**/*.{js,ts}`),
  //   }),
  // }),
  schema: 'http://127.0.0.1:8911/graphql',
  config: {
    scalars: {
      DateTime: 'string',
      Date: 'string',
      JSON: 'Record<string, unknown>',
      JSONObject: 'Record<string, unknown>',
      Time: 'string',
    },
    omitOperationSuffix: true, // prevent type names being PetQueryQuery, RW generators already append Query/Mutation/etc.
  },
  generates: {
    './api/types/gql-types.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
    },
    './web/types/gql-types.ts': {
      documents: './web/src/**/!(*.d).{ts,tsx,js,jsx}',
      plugins: ['typescript', 'typescript-operations'],
    },
  },
}

export async function generateGqlTypes() {
  await generate(GENERATOR_CONFIG, true)
}
