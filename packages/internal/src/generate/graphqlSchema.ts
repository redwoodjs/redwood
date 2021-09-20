import path from 'path'

import { generate } from '@graphql-codegen/cli'
import chalk from 'chalk'

import { getPaths } from '../paths'

export const generateGraphQLSchema = async () => {
  const rwjsPaths = getPaths()
  type GenerateResponse = { filename: string; contents: string }[]
  try {
    const f: GenerateResponse = await generate(
      {
        cwd: rwjsPaths.api.src,
        schema: [
          path.join(__dirname, '../rootGqlSchema.js'), // support loading from either compiled JS
          path.join(__dirname, '../rootGqlSchema.ts'), // or TS (for jest tests)
          'graphql/**/*.sdl.{js,ts}',
          'directives/**/*.{js,ts}',
        ],
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
          // Note the plugin passed, we're not generating types here.
          // its subtley different to generateTypeDefGraphQL
          [rwjsPaths.generated.schema]: {
            plugins: ['schema-ast'],
          },
        },
        silent: false,
        errorsOnly: true,
      },
      true
    )
    return f[0].filename
  } catch (e: any) {
    // `generate` outputs errors which are helpful.
    // This tries to clean up the output of those errors.
    console.error(e)
    console.error(chalk.red('Error parsing SDLs or Schema'))
    for (const error of e?.errors) {
      console.error(error.details)
    }

    console.warn()
  }

  return undefined
}
