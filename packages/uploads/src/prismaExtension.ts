import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Prisma as PrismaExtension } from '@prisma/client/extension'
import type * as runtime from '@prisma/client/runtime/library'


import { fileToDataUri } from './fileSave.utils.js'
import type { SignedUrlSettings } from './lib/signedUrls.js'
import { UrlSigner } from './lib/signedUrls.js'
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
  signedUrlSettings?: SignedUrlSettings,
) => {
  // @TODO I think we can use Prisma.getExtensionContext(this)
  // instead of creating a new PrismaClient instance
  const prismaInstance = new PrismaClient()

  let signedUrlGenerator: UrlSigner
  if (signedUrlSettings) {
    signedUrlGenerator = new UrlSigner(signedUrlSettings)
  }

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
    const record =
      // @ts-expect-error laskndglkn
      await prismaInstance[model as ModelNames].findFirstOrThrow(args)

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
      withSignedUrl: {
        needs,
        compute(modelData) {
          return (expiresIn?: number) => {
            if (!signedUrlGenerator) {
              throw new Error(
                'Please supply signed url settings in setupUpload()',
              )
            }
            const signedUrlFields: Record<keyof typeof needs, string> = {}

            for (const field of uploadFields) {
              signedUrlFields[field] = signedUrlGenerator.generateSignedUrl(
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
  async function removeUploadedFiles(uploadFields: string[], args: any) {
    for await (const field of uploadFields) {
      const uploadLocation = args.data?.[field] as string
      if (uploadLocation) {
        await storageAdapter.remove(uploadLocation)
      }
    }
  }
}
