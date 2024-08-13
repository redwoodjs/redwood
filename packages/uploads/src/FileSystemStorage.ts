import fs from 'node:fs/promises'
import path from 'node:path'

import type { StorageAdapter } from './StorageAdapter.js'
import type { SaveOptions } from './StorageAdapter.js'

export class FileSystemStorage implements StorageAdapter {
  // let basePath: string
  // @TODO enable base path
  // constructor({ basePath }) {
  //   this.basePath = basePath
  // }

  async save(o_file: File, saveOpts: SaveOptions) {
    // const file = new File([o_file], o_file.name)
    // console.log(`👉 \n ~ FileSystemStorage ~ file:`, file.name)
    console.log(`👉 \n ~ FileSystemStorage ~ file:`, await o_file.text())

    const location = path.join(saveOpts.path, saveOpts.fileName + o_file.type)
    const nodeBuffer = await o_file.arrayBuffer()
    const extension = path.extname(o_file.name)

    await fs.writeFile(`${location}.${extension}`, Buffer.from(nodeBuffer))
    return { location }
  }
  async remove(filePath: string) {
    await fs.unlink(filePath)
  }
}
