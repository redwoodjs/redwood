import {
  createFileListProcessor,
  createUploadProcessors,
} from './createProcessors.js'
import {
  createUploadsExtension,
  type UploadsConfig,
} from './prismaExtension.js'
import type { StorageAdapter } from './StorageAdapter.js'

export const setupUploads = (
  uploadsConfig: UploadsConfig,
  storageAdapter: StorageAdapter,
) => {
  const prismaExtension = createUploadsExtension(uploadsConfig, storageAdapter)
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
