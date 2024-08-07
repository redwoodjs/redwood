import fs from 'node:fs/promises'
import path from 'node:path'

import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client/extension'
import type * as runtime from '@prisma/client/runtime/library'
import mime from 'mime-types'
import { ulid } from 'ulid'

import { getPaths } from '@redwoodjs/project-config'

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

export type UploadsConfig<MName extends string> = Record<
  MName,
  UploadConfigForModel
>

type TUSServerConfig = {
  tusUploadDirectory: string
}
export const createUploadsExtension = <MNames extends ModelNames = ModelNames>(
  config: UploadsConfig<MNames>,
  tusConfig?: TUSServerConfig,
) => {
  // @TODO I think we can use Prisma.getExtensionContext(this)
  // instead of creating a new PrismaClient instance
  const prismaInstance = new PrismaClient()

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

  const resultExtends = {} as {
    [K in MNames]: {
      withDataUri: {
        needs: Record<string, boolean>
        compute: (
          // @MARK: this is a hack
          // There has to be a better way to type this... because if you used a select or omit
          // it would be a different type
          modelData: ReturnType<PrismaClient[K]['findFirst']>,
        ) => () => ReturnType<PrismaClient[K]['findFirst']>
      }
    }
  }

  for (const modelName in config) {
    // Guaranteed to have modelConfig, we're looping over config 🙄
    const modelConfig = config[modelName] as UploadConfigForModel
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
        async compute(modelData) {
          const base64UploadFields: Record<keyof typeof needs, string> = {}
          type ModelField = keyof typeof modelData

          for await (const field of uploadFields) {
            base64UploadFields[field] = await fs.readFile(
              modelData[field as ModelField] as string,
              'base64url',
            )
          }

          // @TODO: edge cases
          // 1. If readfile fails - file not found, etc.
          // 2. If not a path, relative or absolute, throw error

          return {
            ...modelData,
            ...base64UploadFields,
          }
        },
      },
    }
  }

  return Prisma.defineExtension((client) => {
    return client.$extends({
      name: 'redwood-upload-prisma-plugin',
      // query: queryExtends,
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

async function saveUploadToFile(
  uploadUrlOrDataUrl: string,
  { fileName, saveDir }: { saveDir: string; fileName: string },
  tusConfig?: TUSServerConfig,
) {
  let outputPath: string | null = null

  if (isBase65(uploadUrlOrDataUrl)) {
    outputPath = await saveBase65File(uploadUrlOrDataUrl, {
      saveDir,
      fileName,
    })
  } else if (uploadUrlOrDataUrl.startsWith('http')) {
    if (!tusConfig) {
      throw new Error('TusConfig not supplied.')
    }

    outputPath = await saveTusUpload(uploadUrlOrDataUrl, {
      tusConfig,
      saveDir,
      fileName,
    })
  } // @TODO: add support for form uploads?

  if (!outputPath) {
    throw new Error('Unsupported upload URL')
  }

  // @MARK: we can create a new record on the uploads table here

  return outputPath
}

// @MARK: if we block the TUS GET, we don't really need to move it
// We send the TUS upload URL as the value of the field
async function saveTusUpload(
  uploadUrl: string,
  {
    tusConfig,
    saveDir,
    fileName,
  }: {
    tusConfig: TUSServerConfig
    saveDir: string
    fileName: string
  },
) {
  // Get the last part of the TUS upload url
  // http://localhost:8910/.redwood/functions/uploadTUS/👉28fa96bf5772338d51👈
  const tusId = uploadUrl.split('/').slice(-1).pop()

  if (!tusId) {
    throw new Error('Could not extract upload ID from URL')
  }

  if (!tusConfig.tusUploadDirectory) {
    throw new Error(
      'You have to configure the TUS Upload Directory in the prisma extension. It is required for TUS uploads',
    )
  }

  // Optional Step....
  const metaFile = path.join(
    path.isAbsolute(tusConfig.tusUploadDirectory)
      ? tusConfig.tusUploadDirectory
      : // @MARK: if the directory supplied isn't relative
        path.join(getPaths().base, tusConfig.tusUploadDirectory),
    `${tusId}.json`,
  )
  // Can't await import, because JSON file.
  const tusMeta = require(metaFile)

  const fileExtension = tusMeta.metadata.filetype.split('/')[1]

  const savedFilePath = path.join(saveDir, `${fileName}.${fileExtension}`)

  // @MARK: we can also move...
  await fs.copyFile(
    path.join(tusConfig.tusUploadDirectory, tusId),
    savedFilePath,
  )

  return savedFilePath
}

function isBase65(uploadUrlOrDataUrl: string) {
  // Check if the uploadUrlOrDataUrl is a valid base64 string
  const base64Regex = /^data:(.*?);base64,/
  return base64Regex.test(uploadUrlOrDataUrl)
}

async function saveBase65File(
  dataUrlString: string,
  { saveDir, fileName }: { saveDir: string; fileName: string },
) {
  const [dataType, fileContent] = dataUrlString.split(',')
  // format is data:image/png;base64,....
  const fileExtension = getFileExtension(dataType)
  const filePath = path.join(saveDir, `${fileName}.${fileExtension}`)

  await fs.writeFile(filePath, Buffer.from(fileContent, 'base64'))

  return filePath
}

export function getFileExtension(dataType: string): string {
  const mimeType = dataType.split(':')[1].split(';')[0]
  const extension = mime.extension(mimeType)
  if (!extension) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }
  return extension
}
