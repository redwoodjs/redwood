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

export type SaveOptions = {
  fileName: string
  path: string
}

export abstract class StorageAdapter {
  abstract save(file: File, saveOpts?: SaveOptions): Promise<AdapterResult>
  abstract remove(fileLocation: AdapterResult['location']): Promise<void>
  // abstract replace(fileId: string, file: File): Promise<AdapterResult>
}
