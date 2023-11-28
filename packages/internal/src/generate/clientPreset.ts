import { generate } from '@graphql-codegen/cli'
import type { CodegenConfig } from '@graphql-codegen/cli'
import { addTypenameSelectionDocumentTransform } from '@graphql-codegen/client-preset'

import { getConfig, getPaths } from '@redwoodjs/project-config'

import {
  trustedDocumentsStore,
  replaceGqlTagWithTrustedDocumentGraphql,
} from './trustedDocuments'
import type { GeneratedFile } from './types'

export const shouldGenerateTrustedDocuments = (): boolean => {
  const config = getConfig()

  return config.graphql.trustedDocuments
}

export const generateClientPreset = async () => {
  let generatedFiles = []
  let clientPresetFiles = [] as string[]

  const errors: { message: string; error: unknown }[] = []

  if (!shouldGenerateTrustedDocuments()) {
    return { clientPresetFiles, trustedDocumentsStoreFile: [], errors }
  }

  const documentsGlob = `${getPaths().web.src}/**/!(*.d).{ts,tsx,js,jsx}`

  const config: CodegenConfig = {
    schema: getPaths().generated.schema,
    documents: documentsGlob,
    silent: true, // Plays nicely with cli task output
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

  try {
    generatedFiles = await generate(config, true)

    clientPresetFiles = generatedFiles.map((f: GeneratedFile) => f.filename)

    const trustedDocumentsStoreFile = trustedDocumentsStore(generatedFiles)
    replaceGqlTagWithTrustedDocumentGraphql(generatedFiles)

    return {
      clientPresetFiles,
      trustedDocumentsStoreFile,
      errors,
    }
  } catch (e) {
    errors.push({
      message: 'Error: Could not generate GraphQL client preset',
      error: e,
    })

    return {
      clientPresetFiles,
      trustedDocumentsStoreFile: [],
      errors,
    }
  }
}
