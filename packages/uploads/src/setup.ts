import {
  createFileListProcessor,
  createUploadProcessors,
} from './createProcessors.js'
import type { UrlSigner } from './lib/signedUrls.js'
import type { ModelNames, UploadsConfig } from './prismaExtension.js'
import { createUploadsExtension } from './prismaExtension.js'
import type { StorageAdapter } from './StorageAdapter.js'

export const setupUploads = <MNames extends ModelNames>(
  uploadsConfig: UploadsConfig<MNames>,
  storageAdapter: StorageAdapter,
  urlSigner?: UrlSigner,
) => {
  const prismaExtension = createUploadsExtension(
    uploadsConfig,
    storageAdapter,
    urlSigner,
  )

  const uploadsProcessors = createUploadProcessors(
    uploadsConfig,
    storageAdapter,
  )

  const fileListProcessor = createFileListProcessor(storageAdapter)

  return {
    prismaExtension,
    uploadsProcessors,
    fileListProcessor,
  }
}
