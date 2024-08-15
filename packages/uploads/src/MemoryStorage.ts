import path from 'node:path'

import mime from 'mime-types'
import { ulid } from 'ulid'

import type { AdapterOptions, StorageAdapter } from './StorageAdapter.js'
import type { SaveOptionsOverride } from './StorageAdapter.js'

export class MemoryStorage implements StorageAdapter {
 constructor(adapterOpts: AdapterOptions) {
  this.adapterOpts = adapterOpts
 }

  adapterOpts: AdapterOptions
  store: Record<string, any> = {}

  async save(file: File, saveOpts?: SaveOptionsOverride) {
    const randomFileName = ulid()
    const extension = mime.extension(file.type) ? `.${mime.extension(file.type)}` : ''
    const location = path.join(saveOpts?.path || this.adapterOpts.baseDir, saveOpts?.fileName || randomFileName + `${extension}`)
    const nodeBuffer = await file.arrayBuffer()

    const result = `${location}`
    this.store[result] = Buffer.from(nodeBuffer)

    return {
      location: result
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
