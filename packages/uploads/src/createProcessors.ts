import type { UploadsConfig } from "./prismaExtension.js"
import type { SaveOptionsOverride, StorageAdapter } from "./StorageAdapter.js"

// Assumes you pass in the graphql type
type MakeFilesString<T> = {
  [K in keyof T]: T[K] extends File ? string : T[K]
}

export const createUploadProcessors = (
  storage: StorageAdapter,
  uploadConfig: UploadsConfig
) => {
  type Processors = {
    [K in keyof typeof uploadConfig]: <T extends Record<string, any>>(data: T, overrideSaveOptions?: SaveOptionsOverride) => Promise<MakeFilesString<T>>
  }

  // @TODO TS: how do I get make it process${keyof UploadsConfig}Uploads so it autocompletes?
  const processors: Processors = {}

  Object.keys(uploadConfig).forEach((model) => {
    const currentModelUploadFields = Array.isArray(uploadConfig[model].fields) ? uploadConfig[model].fields : [uploadConfig[model].fields]

    const capitalCaseModel = `${model.charAt(0).toUpperCase() + model.slice(1)}`
    processors[`process${capitalCaseModel}Uploads`] = async(
      data,
      overrideSaveOptions
    ) => {
      const updatedFields = {} as Record<string, string>
      for await (const field of currentModelUploadFields) {
        if (data[field]) {
          // @TODO deal with file lists
          const file = data[field] as File

          // @TODO: should we automatically create a directory for each model?
          // you can always override it in the saveOpts
          const { location } = await storage.save(file, overrideSaveOptions)

          updatedFields[field] = location
        }
      }
      return {
        ...data,
        ...updatedFields
      }
    }
  })

  return processors
}
