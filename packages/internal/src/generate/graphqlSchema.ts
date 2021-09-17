import { generate } from '@graphql-codegen/cli'
import chalk from 'chalk'

import { getPaths } from '../paths'

// TODO: This is a duplicate of the same root schema in `@redwoodjs/api`
// We need to have a decent way to share this between generated and api.
const rootSchema = `
scalar Date
scalar Time
scalar DateTime
scalar JSON
scalar JSONObject

type Redwood {
  version: String
  currentUser: JSON
  prismaVersion: String
}

type Query {
  redwood: Redwood
}`

export const generateGraphQLSchema = async () => {
  const rwjsPaths = getPaths()
  type GenerateResponse = { filename: string; contents: string }[]
  try {
    const f: GenerateResponse = await generate(
      {
        cwd: rwjsPaths.api.src,
        schema: [
          rootSchema,
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
    console.error()
    console.error(chalk.red('Error parsing SDLs or Schema'))
    for (const error of e?.errors) {
      console.error(error.details)
    }

    console.error()

    return undefined
  }
}
