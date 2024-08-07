import fs from 'node:fs/promises'
import path from 'node:path'

import mime from 'mime-types'

import { getPaths } from '@redwoodjs/project-config'

export type TUSServerConfig = {
  tusUploadDirectory: string
}

/**
 * This function takes an upload field, determines whether its TUS or Base64, and saves it to the file system.
 */
export async function saveUploadToFile(
  uploadUrlOrDataUrl: string,
  { fileName, saveDir }: { saveDir: string; fileName: string },
  tusConfig?: TUSServerConfig,
) {
  let outputPath: string | null = null

  if (isBase64DataUri(uploadUrlOrDataUrl)) {
    outputPath = await saveBase64DataUriToFile(uploadUrlOrDataUrl, {
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
  }

  if (!outputPath) {
    throw new Error('Unsupported upload URL')
  }

  // @MARK: we can create a new record on the uploads table here

  return outputPath
}

// @MARK: if we block the TUS GET, we don't really need to move it
// We send the TUS upload URL as the value of the field
export async function saveTusUpload(
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

function isBase64DataUri(uploadUrlOrDataUrl: string) {
  // Check if the uploadUrlOrDataUrl is a valid base64 string
  const base64Regex = /^data:(.*?);base64,/
  return base64Regex.test(uploadUrlOrDataUrl)
}

async function saveBase64DataUriToFile(
  dataUrlString: string,
  { saveDir, fileName }: { saveDir: string; fileName: string },
) {
  const [dataType, fileContent] = dataUrlString.split(',')
  // format is data:image/png;base64,....
  const fileExtension = getFileExtensionFromDataUri(dataType)
  const filePath = path.join(saveDir, `${fileName}.${fileExtension}`)

  await fs.writeFile(filePath, Buffer.from(fileContent, 'base64'))

  return filePath
}

export function getFileExtensionFromDataUri(dataType: string): string {
  const mimeType = dataType.split(':')[1].split(';')[0]
  const extension = mime.extension(mimeType)
  if (!extension) {
    throw new Error(`Unsupported file type: ${mimeType}`)
  }
  return extension
}

export async function fileToDataUri(filePath: string) {
  const base64Data = await fs.readFile(filePath, 'base64')
  const ext = path.extname(filePath)
  const mimeType = mime.lookup(ext)

  return `data:${mimeType};base64,${base64Data}`
}
