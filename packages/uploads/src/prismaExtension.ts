import fs from 'node:fs/promises'

import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'
import type * as runtime from '@prisma/client/runtime/library'
import { ulid } from 'ulid'

import {
  fileToDataUri,
  saveUploadToFile,
  type TUSServerConfig,
} from './fileSave.utils.js'

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

export type UploadsConfig<MName extends string | number | symbol = Model> =
  Record<MName, UploadConfigForModel>

export const createUploadsExtension = <MNames extends ModelNames = ModelNames>(
  config: UploadsConfig<MNames>,
  tusConfig?: TUSServerConfig,
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

  async function deleteUploadsFromDiskForArgs<T extends runtime.JsArgs>({
    model,
    args,
    fields,
  }: {
    model: string
    args: T
    fields: string[]
  }) {
    // With strict mode you cannot call findFirstOrThrow with the same args, because it is a union type
    // Ideally there's a better way to do this
    const record = await (
      prismaInstance[model as ModelNames] as any
    ).findFirstOrThrow(args)

    // Delete the file from the file system
    fields.forEach(async (field) => {
      const filePath = record[field]
      await fs.unlink(filePath)
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
        await deleteUploadsFromDiskForArgs({
          model,
          args: {
            // The update args contains data, which we don't need to supply to delete
            where: args.where,
          },
          fields: uploadFields,
        })

        const uploadArgs = await saveUploads(
          uploadFields,
          args,
          modelConfig,
          tusConfig,
        )

        return query(uploadArgs)
      },
      async create({ query, args }) {
        const uploadArgs = await saveUploads(
          uploadFields,
          args,
          modelConfig,
          tusConfig,
        )

        return query(uploadArgs)
      },
      async delete({ model, query, args }) {
        await deleteUploadsFromDiskForArgs({
          model,
          args,
          fields: uploadFields,
        })

        return query(args)
      },
      // findMany({ query, args, operation }) {}
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
      [key: string]: runtime.JsInputValue
    }
  },
  modelConfig: UploadConfigForModel,
  tusConfig?: TUSServerConfig,
) {
  const fieldsToUpdate: {
    [key: string]: string
  } = {}

  if (!args.data) {
    throw new Error('No data in prisma query')
  }

  // For each upload property, we need to:
  // 1. save the file to the file system (path or name from config)
  // 2. replace the value of the field
  for await (const field of uploadFields) {
    const uploadUrlOrDataUrl = args.data[field] as string

    if (!uploadUrlOrDataUrl) {
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

    const savedFilePath = await saveUploadToFile(
      uploadUrlOrDataUrl,
      {
        fileName,
        saveDir,
      },
      tusConfig,
    )

    fieldsToUpdate[field] = savedFilePath

    // Call the onFileSaved callback
    // Having it here means it'll always trigger whether create/update
    if (modelConfig.onFileSaved) {
      await modelConfig.onFileSaved(savedFilePath)
    }
  }

  // Can't spread according to TS
  const newData = Object.assign(args.data, fieldsToUpdate)

  return {
    ...args,
    data: newData,
  }
}
