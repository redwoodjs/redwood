// import * as addPlugin from '@graphql-codegen/add'
import { generate } from '@graphql-codegen/cli'
import type { CodegenConfig } from '@graphql-codegen/cli'

import { getPaths } from '@redwoodjs/project-config'

export const generateClientPreset = async () => {
  const errors: { message: string; error: unknown }[] = []

  const documentsGlob = `${getPaths().web.src}/**/!(*.d).{ts,tsx,js,jsx}`

  const config: CodegenConfig = {
    schema: getPaths().generated.schema,
    documents: documentsGlob,
    generates: {
      // should be graphql.d.ts
      [`${getPaths().web.base}/types/types.d.ts`]: {
        plugins: ['typescript', 'typescript-operations', 'add'],
        config: {
          enumsAsTypes: true,
          content: 'import { Prisma } from "@prisma/client"',
          placement: 'prepend',
          scalars: {
            // We need these, otherwise these scalars are mapped to any
            BigInt: 'number',
            // @Note: DateTime fields can be valid Date-strings, or the Date object in the api side. They're always strings on the web side.
            DateTime: 'string',
            Date: 'string',
            JSON: 'Prisma.JsonValue',
            JSONObject: 'Prisma.JsonObject',
            Time: 'string',
          },
          namingConvention: 'keep', // to allow camelCased query names
          omitOperationSuffix: true,
        },
      },
      [`${getPaths().web.src}/graphql/`]: {
        preset: 'client',
        presetConfig: {
          persistedDocuments: true,
        },
        config: {
          documentMode: 'string',
        },
      },
    },
    // watch: true,
    // ignoreNoDocuments: true,
    // watchConfig: {}
  }

  let generatedFiles = []
  try {
    generatedFiles = await generate(config, true) // ?
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL client preset',
      error: e,
    })
  }

  const clientPresetFiles = generatedFiles.map(
    (f: { filename: string; content: string; hooks: string }) => f.filename
  )

  // TODO: Need to copy the persisted-documents.json to api side

  return {
    clientPresetFiles,
    errors,
  }
}
