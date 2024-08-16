import { ulid } from 'ulid'

import type { UploadsConfig } from './prismaExtension.js'
import type { SaveOptionsOverride, StorageAdapter } from './StorageAdapter.js'

// Assumes you pass in the graphql type
type MakeFilesString<T> = {
  [K in keyof T]: T[K] extends File ? string : T[K]
}

export const createFileListProcessor = (storage: StorageAdapter) => {
  return async (files: File[], pathOverrideOnly?: { path?: string }) => {
    const locations = await Promise.all(
      files.map(async (file) => {
        const { location } = await storage.save(file, pathOverrideOnly)
        return location
      }),
    )

    return locations
  }
}

/*
This creates a processor for each model in the uploads config (i.e. tied to a model in the prisma schema)
The processor will only handle single file uploads, not file lists.
*/
export const createUploadProcessors = (
  uploadConfig: UploadsConfig,
  storage: StorageAdapter,
) => {
  type modelNamesInUploadConfig = keyof typeof uploadConfig

  type uploadProcessorNames =
    `process${Capitalize<modelNamesInUploadConfig>}Uploads`

  type Processors = {
    [K in uploadProcessorNames]: <T extends Record<string, any>>(
      // @TODO(TS): T should be the type of the model
      data: T,
      overrideSaveOptions?: SaveOptionsOverride,
    ) => Promise<MakeFilesString<T>>
  }

  const processors = {} as Processors

  Object.keys(uploadConfig).forEach((model) => {
    const modelKey = model as keyof typeof uploadConfig

    const currentModelUploadFields = Array.isArray(
      uploadConfig[modelKey].fields,
    )
      ? uploadConfig[modelKey].fields
      : [uploadConfig[modelKey].fields]

    const capitalCaseModel = `${model.charAt(0).toUpperCase() + model.slice(1)}`
    const processorKey = `process${capitalCaseModel}Uploads` as keyof Processors

    processors[processorKey] = async (data, overrideSaveOptions) => {
      const updatedFields = {} as Record<string, string>
      for await (const field of currentModelUploadFields) {
        if (data[field]) {
          const file = data[field] as File

          const saveOptions = overrideSaveOptions || {
            fileName: `${model}-${field}-${ulid()}`,
          }
          const { location } = await storage.save(file, saveOptions)

          updatedFields[field] = location
        }
      }
      return {
        ...data,
        ...updatedFields,
      }
    }
  })

  return processors
}
