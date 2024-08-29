import type { StorageAdapter } from './StorageAdapter.js'

export async function fileToDataUri(filePath: string, storage: StorageAdapter) {
  const { contents, type: mimeType } = await storage.read(filePath)

  const base64Data = Buffer.from(contents).toString('base64')

  return `data:${mimeType};base64,${base64Data}`
}
