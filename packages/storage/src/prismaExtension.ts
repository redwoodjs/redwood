import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Prisma as PrismaExtension } from '@prisma/client/extension'
import type * as runtime from '@prisma/client/runtime/library'

import type { BaseStorageAdapter } from './adapters/BaseStorageAdapter.js'
import { fileToDataUri } from './fileToDataUri.js'
import type { UrlSigner } from './UrlSigner.js'

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

export type StorageConfigForModel<TPrismaModelName extends ModelNames> = {
  fields:
    | PrismaModelFields<TPrismaModelName>
    | PrismaModelFields<TPrismaModelName>[]
}

export type StorageConfig<MNames extends ModelNames = ModelNames> = {
  [K in MNames]?: StorageConfigForModel<K>
}

type WithSignedUrlArgs = {
  expiresIn?: number
}

export const createStorageExtension = <MNames extends ModelNames = ModelNames>(
  config: StorageConfig<MNames>,
  storageAdapter: BaseStorageAdapter,
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
        ) => <T>(this: T, signArgs?: WithSignedUrlArgs) => T
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

    const StorageFields = (
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
          // If the create fails, we need to delete the Storageed files
          await removeStoredFiles(
            StorageFields,
            args.data as Record<string, string>,
          )
          throw e
        }
      },
      async createMany({ query, args }) {
        try {
          const result = await query(args)
          return result
        } catch (e) {
          const createDatas = args.data as []

          // If the create fails, we need to delete the Storageed files
          for await (const createData of createDatas) {
            await removeStoredFiles(StorageFields, createData)
          }

          throw e
        }
      },
      async update({ query, model, args }) {
        // Check if any of the StorageFields are present in args.data
        // We only want to process fields that are being updated
        const StorageFieldsToUpdate = StorageFields.filter(
          (field) =>
            // All of this non-sense is to make typescript happy. I'm not sure how data could be anything but an object
            typeof args.data === 'object' &&
            args.data !== null &&
            field in args.data,
        )

        // If no Storage fields are present, proceed with the original query
        // avoid overhead of extra lookups
        if (StorageFieldsToUpdate.length == 0) {
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
            await removeStoredFiles(StorageFieldsToUpdate, originalRecord)

            return result
          } catch (e) {
            // If the update fails, we need to delete the newly Storageed files
            // but not the ones that already exist!
            await removeStoredFiles(
              StorageFieldsToUpdate,
              args.data as Record<string, string>,
            )
            throw e
          }
        }
      },
      async updateMany({ query, model, args }) {
        // Check if any of the StorageFields are present in args.data
        // We only want to process fields that are being updated
        const StorageFieldsToUpdate = StorageFields.filter(
          (field) =>
            // All of this non-sense is to make typescript happy. I'm not sure how data could be anything but an object
            typeof args.data === 'object' &&
            args.data !== null &&
            field in args.data,
        )

        if (StorageFieldsToUpdate.length == 0) {
          return query(args)
        } else {
          // MULTIPLE!
          const originalRecords = await prismaInstance[
            model as ModelNames
            // @ts-expect-error TS in strict mode will error due to union type. We cannot narrow it down here.
          ].findMany({
            where: args.where,
            // @TODO: should we select here to reduce the amount of data we're handling
          })

          try {
            const result = await query(args)

            // Remove the Storageed files from each of the original records
            for await (const originalRecord of originalRecords) {
              await removeStoredFiles(StorageFieldsToUpdate, originalRecord)
            }

            return result
          } catch (e) {
            // If the update many fails, we need to delete the newly Storageed files
            // but not the ones that already exist!
            await removeStoredFiles(
              StorageFieldsToUpdate,
              args.data as Record<string, string>,
            )
            throw e
          }
        }
      },
      async upsert({ query, model, args }) {
        let isUpdate: boolean | undefined
        const StorageFieldsToUpdate = StorageFields.filter(
          (field) =>
            typeof args.update === 'object' &&
            args.update !== null &&
            field in args.update,
        )

        try {
          let existingRecord: Record<string, string> | undefined
          if (args.update) {
            // We only need to check for existing records if we're updating
            existingRecord = await prismaInstance[
              model as ModelNames
              // @ts-expect-error TS in strict mode will error due to union type. We cannot narrow it down here.
            ].findUnique({
              where: args.where,
            })
            isUpdate = !!existingRecord
          }

          const result = await query(args)

          if (isUpdate && existingRecord) {
            // If the record existed, remove old Storageed files
            await removeStoredFiles(StorageFieldsToUpdate, existingRecord)
          }

          return result
        } catch (e) {
          // If the upsert fails, we need to delete any newly Storageed files
          await removeStoredFiles(
            // Only delete files we're updating on update
            isUpdate ? StorageFieldsToUpdate : StorageFields,
            (isUpdate ? args.update : args.create) as Record<string, string>,
          )

          throw e
        }
      },

      async delete({ query, args }) {
        const deleteResult = await query(args)
        await removeStoredFiles(
          StorageFields,
          // We don't know the exact type here
          deleteResult as Record<string, string>,
        )

        return deleteResult
      },
    }

    // This makes the result extension only available for models with StorageFields
    const needs = Object.fromEntries(
      StorageFields.map((field) => [field, true]),
    )

    resultExtends[modelName] = {
      withDataUri: {
        needs,
        compute(modelData) {
          return async () => {
            const base64StorageFields: Record<keyof typeof needs, string> = {}

            for await (const field of StorageFields) {
              base64StorageFields[field] = await fileToDataUri(
                modelData[field] as string,
                storageAdapter,
              )
            }

            return {
              // modelData is of type unknown at this point
              ...(modelData as any),
              ...base64StorageFields,
            }
          }
        },
      },
      withSignedUrl: {
        needs,
        compute(modelData) {
          return ({ expiresIn }: WithSignedUrlArgs = {}) => {
            if (!urlSigner) {
              throw new Error(
                'Please supply signed url settings in setupStorage()',
              )
            }
            const signedUrlFields: Record<keyof typeof needs, string> = {}

            for (const field of StorageFields) {
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
      name: 'redwood-Storage-prisma-plugin',
      query: queryExtends,
      result: resultExtends,
    })
  })

  /**
   * This function deletes files from the storage adapter, but importantly,
   * it does NOT throw, because if the file is already gone, that's fine,
   * no need to stop the actual db operation
   *
   */
  async function removeStoredFiles(
    fieldsToDelete: string[],
    data: Record<string, string>,
  ) {
    if (!data) {
      console.warn('Empty data object passed to removeStoredFiles')
      return
    }

    for await (const field of fieldsToDelete) {
      const StorageLocation = data?.[field]
      if (StorageLocation) {
        try {
          await storageAdapter.remove(StorageLocation)
        } catch {
          // Swallow the error, we don't want to stop the db operation
          // It also means that if one of the files in fieldsToDelete is gone, its ok
          // we still want to delete the rest of the files
        }
      }
    }
  }
}
