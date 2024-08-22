import { existsSync, mkdirSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import mime from 'mime-types'

import type { SaveOptionsOverride } from './StorageAdapter.js'
import { StorageAdapter } from './StorageAdapter.js'

export class FileSystemStorage
  extends StorageAdapter
  implements StorageAdapter
{
  constructor(opts: { baseDir: string }) {
    super(opts)
    if (!existsSync(opts.baseDir)) {
      console.log('Creating baseDir >', opts.baseDir)
      mkdirSync(opts.baseDir, { recursive: true })
    }
  }
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

  async read(filePath: string) {
    return {
      contents: await fs.readFile(filePath),
      type: mime.lookup(filePath),
    }
  }

  async remove(filePath: string) {
    await fs.unlink(filePath)
  }
}
