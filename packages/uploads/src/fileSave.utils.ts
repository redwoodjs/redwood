import fs from 'node:fs/promises'
import path from 'node:path'

import mime from 'mime-types'

export async function fileToDataUri(filePath: string) {
  const base64Data = await fs.readFile(filePath, 'base64')
  const ext = path.extname(filePath)
  const mimeType = mime.lookup(ext)

  return `data:${mimeType};base64,${base64Data}`
}
