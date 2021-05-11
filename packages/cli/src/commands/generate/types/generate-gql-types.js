import { getPaths } from 'src/lib'

const { generate } = require('@graphql-codegen/cli')
const chokidar = require('chokidar')

const GENERATOR_CONFIG = {
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
}

let watchHandle

process.on('SIGINT', () => {
  watchHandle?.close()
})

/**  @type ({watch: boolean}) => void **/
export async function generateGqlTypes({ watch }) {
  await generate(GENERATOR_CONFIG, true)

  if (watch) {
    watchHandle = chokidar
      .watch(
        [
          `${getPaths().api.src}/**/*.{ts,tsx}`,
          `${getPaths().web.src}/**/*.{ts,tsx}`,
        ],
        {
          persistent: true,

          ignored: [
            '**/*.test.ts',
            '**/*.test.js',
            '**/__fixtures__/**',
            '**/__tests__/**',
            '**/dist/**',
          ],
        }
      )
      .on('change', (fileName) => {
        console.log(
          `✋ ~ file: generate-gql-types.js ~ line 55 ~ .on ~ fileName`,
          fileName
        )
        generate(GENERATOR_CONFIG, true)
      })
  }
}
