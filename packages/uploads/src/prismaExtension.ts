import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type * as runtime from '@prisma/client/runtime/library'

// @TODO(TS): UploadsConfig behaves differently here.. probably
// the prisma-override not quite there yet?
// import { PrismaClient } from './__tests__/prisma-client/index.js'
// import { Prisma } from './__tests__/prisma-client/index.js'
import { fileToDataUri } from './fileSave.utils.js'
import type { StorageAdapter } from './StorageAdapter.js'

type FilterOutDollarPrefixed<T> = T extends `$${string}`
  ? never
  : T extends symbol // Remove symbol here, because it doesn't help users
    ? never
    : T

// Filter out $on, $connect, etc.
type ModelNames = FilterOutDollarPrefixed<keyof PrismaClient>

export type UploadConfigForModel = {
  // @TODO(TS): I want the fields here to be the fields of the model
  fields: string[] | string
  savePath?: ((args: unknown) => string) | string
  fileName?: (args: unknown) => string
  onFileSaved?: (filePath: string) => void | Promise<void>
}

export type UploadsConfig<MName extends string | number | symbol = ModelNames> =
  Record<MName, UploadConfigForModel>

export const createUploadsExtension = <MNames extends ModelNames = ModelNames>(
  config: UploadsConfig<MNames>,
  storageAdapter: StorageAdapter,
) => {
  // @TODO I think we can use Prisma.getExtensionContext(this)
  // instead of creating a new PrismaClient instance
  const prismaInstance = new PrismaClient()

  type ResultExtends = {
    [K in MNames]: {
      withDataUri: {
        needs: Record<string, boolean>
        compute: (
          modelData: Record<string, unknown>,
        ) => <T>(this: T) => Promise<T>
      }
    }
  }

  async function deleteUpload<T extends runtime.JsArgs>(
    {
      model,
      args,
      fields,
    }: {
      model: string
      args: T
      fields: string[]
    },
    storageAdapter: StorageAdapter,
  ) {
    // With strict mode you cannot call findFirstOrThrow with the same args, because it is a union type
    // Ideally there's a better way to do this
    const record = await (
      prismaInstance[model as ModelNames] as any
    ).findFirstOrThrow(args)

    // Delete the file from the file system
    fields.forEach(async (field) => {
      const filePath = record[field]
      await storageAdapter.remove(filePath)
    })
  }

  const queryExtends: runtime.ExtensionArgs['query'] = {}

  const resultExtends = {} as ResultExtends
  for (const modelName in config) {
    // Guaranteed to have modelConfig, we're looping over config 🙄
    const modelConfig = config[modelName as MNames] as UploadConfigForModel
    const uploadFields = Array.isArray(modelConfig.fields)
      ? modelConfig.fields
      : [modelConfig.fields]

    queryExtends[modelName] = {
      async create({ query, args }) {
        try {
          const result = await query(args)
          return result
        } catch (e) {
          // If the create fails, we need to delete the uploaded files
          await removeUploadedFiles(uploadFields, args)
          throw e
        }
      },
      async update({ query, model, args }) {
        await deleteUpload(
          {
            model,
            args: {
              // The update args contains data, which we don't need to supply to delete
              where: args.where,
            },
            fields: uploadFields,
          },
          storageAdapter,
        )

        // Same as create 👇
        try {
          const result = await query(args)
          return result
        } catch (e) {
          // If the create fails, we need to delete the uploaded files
          await removeUploadedFiles(uploadFields, args)
          throw e
        }
      },

      async delete({ model, query, args }) {
        await deleteUpload(
          {
            model,
            args,
            fields: uploadFields,
          },
          storageAdapter,
        )

        return query(args)
      },
    }

    // This makes the result extension only available for models with uploadFields
    const needs = Object.fromEntries(uploadFields.map((field) => [field, true]))

    resultExtends[modelName] = {
      withDataUri: {
        needs,
        compute(modelData) {
          return async () => {
            const base64UploadFields: Record<keyof typeof needs, string> = {}

            for await (const field of uploadFields) {
              base64UploadFields[field] = await fileToDataUri(
                modelData[field] as string,
              )
            }

            return {
              // modelData is of type unknown at this point
              ...(modelData as any),
              ...base64UploadFields,
            }
          }
        },
      },
    }
  }

  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'redwood-upload-prisma-plugin',
      query: queryExtends,
      result: resultExtends,
    })
  })

  // @TODO(TS): According to TS, data could be a non-object...
  // Setting args to JsArgs causes errors. This could be a legit issue
  async function removeUploadedFiles(uploadFields: string[], args: any) {
    for await (const field of uploadFields) {
      const uploadLocation = args.data?.[field] as string
      if (uploadLocation) {
        await storageAdapter.remove(uploadLocation)
      }
    }
  }
}
