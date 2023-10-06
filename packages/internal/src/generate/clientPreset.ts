import fs from 'fs'
import path from 'path'

import { generate } from '@graphql-codegen/cli'
import type { CodegenConfig } from '@graphql-codegen/cli'
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset'
import { format } from 'prettier'

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
        documentTransforms: [addTypenameSelectionDocumentTransform],
        config: {
          // DO NOT USE documentMode: 'string',
        },
      },
    },
  }

  let generatedFiles = []

  try {
    generatedFiles = await generate(config, true)
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL client preset',
      error: e,
    })
  }

  interface GeneratedFile {
    filename: string
    content: string
    hooks: string
  }
  const clientPresetFiles = generatedFiles.map((f: GeneratedFile) => f.filename)

  // Copy the persisted-documents.json to api side
  const output = generatedFiles.filter((f: GeneratedFile) =>
    f.filename.endsWith('persisted-documents.json')
  )

  const storeFile = output[0]

  if (storeFile && storeFile.conten) {
    const content = format(`export const store = ${storeFile.content}`, {
      trailingComma: 'es5',
      bracketSpacing: true,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
      arrowParens: 'always',
      parser: 'typescript',
    })

    const filename = path.join(getPaths().api.lib, 'persistedOperationStore.ts')
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
  }
  return {
    clientPresetFiles,
    errors,
  }
}
