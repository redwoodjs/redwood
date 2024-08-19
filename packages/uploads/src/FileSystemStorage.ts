import fs from 'node:fs/promises'
import path from 'node:path'


import type { SaveOptionsOverride } from './StorageAdapter.js'
import { StorageAdapter } from './StorageAdapter.js'

export class FileSystemStorage extends StorageAdapter implements StorageAdapter {
  async save(file: File, saveOverride?: SaveOptionsOverride) {
    const fileName = this.generateFileNameWithExtension(saveOverride, file)

    const location = path.join(
      saveOverride?.path || this.adapterOpts.baseDir,
      fileName,
    )
    const nodeBuffer = await file.arrayBuffer()

    await fs.writeFile(location, Buffer.from(nodeBuffer))
    return { location }
  }

  async remove(filePath: string) {
    await fs.unlink(filePath)
  }
}
