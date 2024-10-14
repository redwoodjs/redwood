// Error codes from react-dropzone
export const FILE_INVALID_TYPE = 'file-invalid-type'
export const FILE_TOO_LARGE = 'file-too-large'
export const FILE_TOO_SMALL = 'file-too-small'
export const TOO_MANY_FILES = 'too-many-files'

export const formatFileSize = (bytes: number) => {
  const mb = 1024 * 1024
  const kb = 1024
  return bytes >= mb
    ? `${(bytes / mb).toFixed(2)} MB`
    : `${(bytes / kb).toFixed(2)} KB`
}

export const getReadableErrorMessage = (
  file: File,
  code: string,
  message: string,
) => {
  switch (code) {
    case FILE_INVALID_TYPE:
      return `Invalid file type. File ${file.name} is ${file.type}.`
    case FILE_TOO_LARGE:
      return `File is too large. File ${file.name} is ${formatFileSize(file.size)}.`
    case FILE_TOO_SMALL:
      return `File is too small. File ${file.name} is ${formatFileSize(file.size)}.`
    case TOO_MANY_FILES:
      return 'Too many files uploaded'
    default:
      return message
  }
}
