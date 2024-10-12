export const DEFAULT_UPLOAD_APP_NAME = 'RedwoodApp'
export const DEFAULT_UPLOAD_TOKEN_HEADER_NAME = 'x-rw-upload-token'
export const DEFAULT_UPLOAD_TARGET = 'RedwoodUpload'

// set sensible defaults for content types, max file size, etc
// export const APP_NAME = 'pixeez'
// Represents where the upload is intended for to
//signify that it's for the upload functionality of your app,
// such as 'uploads'.
// export const UPLOAD_TARGET = 'uploads'

// set sensible defaults for content types
export const IMAGE_FILE_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
}

export const VIDEO_FILE_TYPES = {
  'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
}

export const AUDIO_FILE_TYPES = {
  'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
}

export const DOCUMENT_FILE_TYPES = {
  'application/*': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
}

export const IMAGE_CONTENT_TYPES = Object.values(IMAGE_FILE_TYPES)
  .flat()
  .map((ext) => `image/${ext.slice(1)}`)

export const DOCUMENT_CONTENT_TYPES = Object.values(DOCUMENT_FILE_TYPES)
  .flat()
  .map((ext) => `application/${ext.slice(1)}`)

export const VIDEO_CONTENT_TYPES = Object.values(VIDEO_FILE_TYPES)
  .flat()
  .map((ext) => `video/${ext.slice(1)}`)

export const AUDIO_CONTENT_TYPES = Object.values(AUDIO_FILE_TYPES)
  .flat()
  .map((ext) => `audio/${ext.slice(1)}`)

// set sensible defaults for max file size, max files, min files, etc
export const MAX_FILE_SIZE = 5 * 1024 * 1024
export const MAX_FILES = 20
export const MIN_FILES = 1
export const EXPIRES_IN = '1hr'
