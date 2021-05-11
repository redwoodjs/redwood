const { generate } = require('@graphql-codegen/cli')

export async function generateGqlTypes() {
  await generate(
    {
      // schema: makeMergedSchema({
      //   schemas,
      //   services: makeServices({ services }),
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
    },
    true
  )
}
