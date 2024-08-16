import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type * as runtime from '@prisma/client/runtime/library'
import { ulid } from 'ulid'

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

        const uploadArgs = await saveUploads(
          uploadFields,
          args,
          modelConfig,
          storageAdapter,
        )

        return query(uploadArgs)
      },
      async create({ query, args }) {
        const uploadArgs = await saveUploads(
          uploadFields,
          args,
          modelConfig,
          storageAdapter,
        )

        return query(uploadArgs)
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
            type ModelField = keyof typeof modelData

            for await (const field of uploadFields) {
              base64UploadFields[field] = await fileToDataUri(
                modelData[field as ModelField] as string,
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
}

/**
 * Returns new args to use in create or update.
 *
 * Pass this to the query function!
 */
async function saveUploads(
  uploadFields: string[],
  args: runtime.JsArgs & {
    data?: {
      [key: string]: runtime.JsInputValue | File
    }
  },
  modelConfig: UploadConfigForModel,
  storageAdapter: StorageAdapter,
) {
  const fieldsToUpdate: {
    [key: string]: string
  } = {}

  if (!args.data) {
    throw new Error('No data in prisma query')
  }

  // For each upload property, we need to:z
  // 1. save the file to the file system (path or name from config)
  // 2. replace the value of the field
  for await (const field of uploadFields) {
    const uploadFile = args.data[field] as File
    console.log(`👉 \n ~ uploadFile:`, uploadFile)

    if (!uploadFile) {
      continue
    }

    const fileName =
      modelConfig.fileName && typeof modelConfig.fileName === 'function'
        ? modelConfig.fileName(args)
        : ulid()

    const saveDir =
      typeof modelConfig.savePath === 'function'
        ? modelConfig.savePath(args)
        : modelConfig.savePath || 'web/public/uploads'

    const savedFile = await storageAdapter.save(uploadFile, {
      fileName,
      path: saveDir,
    })

    // @TODO should we return location or fileId?
    fieldsToUpdate[field] = savedFile.location

    // Call the onFileSaved callback
    // Having it here means it'll always trigger whether create/update
    if (modelConfig.onFileSaved) {
      await modelConfig.onFileSaved(savedFile.location)
    }
  }

  // Can't spread according to TS
  const newData = Object.assign(args.data, fieldsToUpdate)

  return {
    ...args,
    data: newData,
  }
}
