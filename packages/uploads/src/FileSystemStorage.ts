import fs from 'node:fs/promises'
import path from 'node:path'

import mime from 'mime-types'
import { ulid } from 'ulid'

import type { SaveOptionsOverride } from './StorageAdapter.js'
import { StorageAdapter } from './StorageAdapter.js'

export class FileSystemStorage
  extends StorageAdapter
  implements StorageAdapter
{
  async save(file: File, saveOpts?: SaveOptionsOverride) {
    const randomFileName = ulid()
    const extension = mime.extension(file.type)
    const location = path.join(
      saveOpts?.path || this.adapterOpts.baseDir,
      saveOpts?.fileName || randomFileName + `.${extension}`,
    )
    const nodeBuffer = await file.arrayBuffer()

    await fs.writeFile(location, Buffer.from(nodeBuffer))
    return { location }
  }
  async remove(filePath: string) {
    await fs.unlink(filePath)
  }
}
