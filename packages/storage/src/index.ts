import type { BaseStorageAdapter } from './adapters/BaseStorageAdapter.js'
import { createUploadSavers } from './createSavers.js'
import type {
  ModelNames,
  UploadConfigForModel,
  UploadsConfig,
} from './prismaExtension.js'
import { createUploadsExtension } from './prismaExtension.js'
import type { UrlSigner } from './UrlSigner.js'

type SetupStorageOptions<MNames extends ModelNames> = {
  uploadsConfig: UploadsConfig<MNames>
  storageAdapter: BaseStorageAdapter
  urlSigner?: UrlSigner
}

export const setupStorage = <MNames extends ModelNames>({
  uploadsConfig,
  storageAdapter,
  urlSigner,
}: SetupStorageOptions<MNames>) => {
  const prismaExtension = createUploadsExtension(
    uploadsConfig,
    storageAdapter,
    urlSigner,
  )

  const saveFiles = createUploadSavers(uploadsConfig, storageAdapter)

  return {
    storagePrismaExtension: prismaExtension,
    saveFiles,
  }
}

/**
 * This is utility function to make sure you get accurate types for your savers.
 *
 * @param UploadsConfig
 * @returns UploadsConfig
 */
export function createUploadsConfig<
  T extends Partial<{
    [K in ModelNames]?: UploadConfigForModel<K>
  }>,
>(uploadsConfig: T): T {
  return uploadsConfig
}

export type { ModelNames, UploadsConfig } from './prismaExtension.js'
