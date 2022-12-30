import archiver from 'archiver'
import fs from 'fs-extra'

export function zipDir(src: string, dest: string) {
  const archive = archiver('zip', { zlib: { level: 5 } })

  const stream = fs.createWriteStream(dest)
  archive.directory(src, false)
  archive.pipe(stream)
  archive.finalize()
}
