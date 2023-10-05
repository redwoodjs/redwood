import { generate } from '@graphql-codegen/cli'
// import * as c from '@graphql-codegen/client-preset'
import { type CodegenConfig } from '@graphql-codegen/cli'

import { getPaths } from '@redwoodjs/project-config'

export const generateClientPreset = async () => {
  const errors: { message: string; error: unknown }[] = []

  const documentsGlob = `${getPaths().web.src}/**/!(*.d).{ts,tsx,js,jsx}`

  const config: CodegenConfig = {
    schema: getPaths().generated.schema,
    documents: documentsGlob,
    generates: {
      [`${getPaths().web.base}/types/types.d.ts`]: {
        plugins: ['typescript'],
        config: { enumsAsTypes: true },
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

  return {
    clientPresetFiles,
    errors,
  }
}
