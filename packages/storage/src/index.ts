import type { BaseStorageAdapter } from './adapters/BaseStorageAdapter.js'
import { createStorageSavers } from './createSavers.js'
import type {
  ModelNames,
  StorageConfig,
  StorageConfigForModel,
} from './prismaExtension.js'
import { createStorageExtension } from './prismaExtension.js'
import type { UrlSigner } from './UrlSigner.js'

type SetupStorageOptions<MNames extends ModelNames> = {
  storageConfig: StorageConfig<MNames>
  storageAdapter: BaseStorageAdapter
  urlSigner?: UrlSigner
}

export const setupStorage = <MNames extends ModelNames>({
  storageConfig,
  storageAdapter,
  urlSigner,
}: SetupStorageOptions<MNames>) => {
  const prismaExtension = createStorageExtension(
    storageConfig,
    storageAdapter,
    urlSigner,
  )

  const saveFiles = createStorageSavers(storageConfig, storageAdapter)

  return {
    storagePrismaExtension: prismaExtension,
    saveFiles,
  }
}

/**
 * This utility function ensures that you receive accurate type suggestions for your savers.
 * If you use the type UploadsConfig directly, you may receive suggestions for saveFiles.forY where Y hasn't been configured.
 * By using this utility function, you will only receive suggestions for the models that you have configured.
 *
 * @param storageConfig The storage configuration object.
 * @returns The same storage configuration object, but with filtered types
 */
export function createStorageConfig<
  T extends Partial<{
    [K in ModelNames]?: StorageConfigForModel<K>
  }>,
>(uploadsConfig: T): T {
  return uploadsConfig
}

export type { ModelNames, StorageConfig } from './prismaExtension.js'
