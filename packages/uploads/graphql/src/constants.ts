export const DEFAULT_UPLOAD_APP_NAME = 'RedwoodApp'
export const DEFAULT_UPLOAD_TOKEN_HEADER_NAME = 'x-rw-upload-token'
export const DEFAULT_UPLOAD_TARGET = 'RedwoodUpload'

// set sensible defaults for content types, max file size, etc
// export const APP_NAME = 'pixeez'
// Represents where the upload is intended for to
//signify that it's for the upload functionality of your app,
// such as 'uploads'.
// export const UPLOAD_TARGET = 'uploads'
export const IMAGE_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]
export const PDF_CONTENT_TYPE = 'application/pdf'
export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_FILES = 20
export const MIN_FILES = 1
export const EXPIRES_IN = '1hr'
