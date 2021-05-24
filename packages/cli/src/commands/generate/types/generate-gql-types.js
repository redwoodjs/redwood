import { generate } from '@graphql-codegen/cli'

const GENERATOR_CONFIG = {
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
