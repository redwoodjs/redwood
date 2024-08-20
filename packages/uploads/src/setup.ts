import {
  createFileListProcessor,
  createUploadProcessors,
} from './createProcessors.js'
import type {
  ModelNames,
  SignedUrlSettings,
  UploadsConfig,
} from './prismaExtension.js'
import { createUploadsExtension } from './prismaExtension.js'
import type { StorageAdapter } from './StorageAdapter.js'

export const setupUploads = <MNames extends ModelNames>(
  uploadsConfig: UploadsConfig<MNames>,
  storageAdapter: StorageAdapter,
  signedUrlSettings?: SignedUrlSettings,
) => {
  const prismaExtension = createUploadsExtension(
    uploadsConfig,
    storageAdapter,
    signedUrlSettings,
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
