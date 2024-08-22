import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Prisma as PrismaExtension } from '@prisma/client/extension'
import type * as runtime from '@prisma/client/runtime/library'

import { fileToDataUri } from './fileHandling.js'
import type { UrlSigner } from './signedUrls.js'
import type { StorageAdapter } from './StorageAdapter.js'

type FilterOutDollarPrefixed<T> = T extends `$${string}`
  ? never
  : T extends symbol // Remove symbol here, because it doesn't help users
    ? never
    : T

// Filter out $on, $connect, etc.
export type ModelNames = FilterOutDollarPrefixed<keyof PrismaClient>

type PrismaModelFields<MName extends ModelNames> = keyof Prisma.Result<
  PrismaClient[MName],
  any,
  'findFirstOrThrow'
>

export type UploadConfigForModel<TPrismaModelName extends ModelNames> = {
  fields:
    | PrismaModelFields<TPrismaModelName>
    | PrismaModelFields<TPrismaModelName>[]
}

export type UploadsConfig<MNames extends ModelNames = ModelNames> = {
  [K in MNames]?: UploadConfigForModel<K>
}

export const createUploadsExtension = <MNames extends ModelNames = ModelNames>(
  config: UploadsConfig<MNames>,
  storageAdapter: StorageAdapter,
  urlSigner?: UrlSigner,
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
      withSignedUrl: {
        needs: Record<string, boolean>
        compute: (
          modelData: Record<string, unknown>,
        ) => <T>(this: T, expiresIn?: number) => Promise<T>
      }
    }
  }

  const queryExtends: runtime.ExtensionArgs['query'] = {}

  const resultExtends = {} as ResultExtends
  for (const modelName in config) {
    // Guaranteed to have modelConfig, we're looping over config 🙄
    const modelConfig = config[modelName]

    if (!modelConfig) {
      continue
    }

    const uploadFields = (
      Array.isArray(modelConfig.fields)
        ? modelConfig.fields
        : [modelConfig.fields]
    ) as string[]

    queryExtends[modelName] = {
      async create({ query, args }) {
        try {
          const result = await query(args)
          return result
        } catch (e) {
          // If the create fails, we need to delete the uploaded files
          await removeUploadedFiles(
            uploadFields,
            args.data as Record<string, string>,
          )
          throw e
        }
      },
      async update({ query, model, args }) {
        // Check if any of the uploadFields are present in args.data
        // We only want to process fields that are being updated
        const uploadFieldsToUpdate = uploadFields.filter(
          (field) =>
            // All of this non-sense is to make typescript happy. I'm not sure how data could be anything but an object
            typeof args.data === 'object' &&
            args.data !== null &&
            field in args.data,
        )

        // If no upload fields are present, proceed with the original query
        // avoid overhead of extra lookups
        if (uploadFieldsToUpdate.length == 0) {
          return query(args)
        } else {
          const originalRecord = await prismaInstance[
            model as ModelNames
            // @ts-expect-error TS in strict mode will error due to union type. We cannot narrow it down here.
          ].findFirstOrThrow({
            where: args.where,
            // @TODO: should we select here to reduce the amount of data we're handling
          })

          // Similar, but not same as create
          try {
            const result = await query(args)

            // **After** we've updated the record, we need to delete the old file.
            await removeUploadedFiles(uploadFieldsToUpdate, originalRecord)

            return result
          } catch (e) {
            // If the update fails, we need to delete the newly uploaded files
            // but not the ones that already exist!
            await removeUploadedFiles(
              uploadFieldsToUpdate,
              args.data as Record<string, string>,
            )
            throw e
          }
        }
      },

      async delete({ model, query, args }) {
        /** Delete args are the same as findFirst, essentially a where clause */
        const record =
          // @ts-expect-error TS in strict mode will error due to union type. We cannot narrow it down here.
          await prismaInstance[model as ModelNames].findFirstOrThrow(args)

        await removeUploadedFiles(uploadFields, record)

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
                storageAdapter,
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
      withSignedUrl: {
        needs,
        compute(modelData) {
          return (expiresIn?: number) => {
            if (!urlSigner) {
              throw new Error(
                'Please supply signed url settings in setupUpload()',
              )
            }
            const signedUrlFields: Record<keyof typeof needs, string> = {}

            for (const field of uploadFields) {
              if (!modelData[field]) {
                continue
              }

              signedUrlFields[field] = urlSigner.generateSignedUrl(
                modelData[field] as string,
                expiresIn,
              )
            }

            return {
              // modelData is of type unknown at this point
              ...(modelData as any),
              ...signedUrlFields,
            }
          }
        },
      },
    }
  }

  return PrismaExtension.defineExtension((client) => {
    return client.$extends({
      name: 'redwood-upload-prisma-plugin',
      query: queryExtends,
      result: resultExtends,
    })
  })

  // @TODO(TS): According to TS, data could be a non-object...
  // Setting args to JsArgs causes errors. This could be a legit issue
  async function removeUploadedFiles(
    fieldsToDelete: string[],
    data: Record<string, string>,
  ) {
    if (!data) {
      console.warn('Empty data object passed to removeUploadedFiles')
      return
    }

    for await (const field of fieldsToDelete) {
      const uploadLocation = data?.[field]
      if (uploadLocation) {
        try {
          await storageAdapter.remove(uploadLocation)
        } catch {
          // Swallow the error, we don't want to stop the delete operation
        }
      }
    }
  }
}
