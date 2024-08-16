/**
 * The storage adapter will just save the file and return
 * {
 *  fileId: string,
 *  location: string, // depending on storage it could be a path
 * }
 */

export type AdapterResult = {
  location: string
}

export type SaveOptionsOverride = {
  fileName?: string
  path?: string
}

export type AdapterOptions = {
  baseDir: string
}

export abstract class StorageAdapter {
  adapterOpts: AdapterOptions
  constructor(adapterOpts: AdapterOptions) {
    this.adapterOpts = adapterOpts
  }

  getAdapterOptions() {
    return this.adapterOpts
  }

  abstract save(
    file: File,
    saveOpts?: SaveOptionsOverride,
  ): Promise<AdapterResult>
  abstract remove(fileLocation: AdapterResult['location']): Promise<void>
  // abstract replace(fileId: string, file: File): Promise<AdapterResult>
}
