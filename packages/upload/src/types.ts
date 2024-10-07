export type UploadErrorMessage = string | ((config: UploadConfig) => string)

export type UploadErrorMessages = {
  uploadTokenRequired?: UploadErrorMessage
  operationNameRequired?: UploadErrorMessage
  invalidUploadToken?: UploadErrorMessage
  tooFewFiles?: UploadErrorMessage
  tooManyFiles?: UploadErrorMessage
  tooLargeFile?: UploadErrorMessage
  tooManyRequests?: UploadErrorMessage
  invalidFileType?: UploadErrorMessage
}

export type UploadConfig = {
  contentTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  minFiles?: number
  expiresIn?: string | number
}

export type UploadTokenPayload = UploadConfig & {
  operationName: string
}

export type RedwoodUploadOptions = {
  appName: string
  uploadTarget?: string
  uploadTokenHeaderName?: string
  errorMessages?: UploadErrorMessages
}
