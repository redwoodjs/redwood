import path from 'node:path'


import { StorageAdapter } from './StorageAdapter.js'
import type { SaveOptionsOverride } from './StorageAdapter.js'

export class MemoryStorage extends StorageAdapter implements StorageAdapter {
  store: Record<string, any> = {}

  async save(file: File, saveOpts?: SaveOptionsOverride) {
    const fileName = this.generateFileNameWithExtension(saveOpts, file)

    const location = path.join(
      saveOpts?.path || this.adapterOpts.baseDir,
      fileName,
    )
    const nodeBuffer = await file.arrayBuffer()

    this.store[location] = Buffer.from(nodeBuffer)

    return {
      location,
    }
  }

  async remove(filePath: string) {
    delete this.store[filePath]
  }

  // Not sure about read method... should it be in the base class?
  async read(filePath: string) {
    return this.store[filePath]
  }

  async clear() {
    this.store = {}
  }
}
