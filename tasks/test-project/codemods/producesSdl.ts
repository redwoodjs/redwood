import type { FileInfo } from 'jscodeshift'

export default (file: FileInfo) => {
  return file.source.replaceAll('@requireAuth', '@skipAuth')
}
