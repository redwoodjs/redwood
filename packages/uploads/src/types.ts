export type UploadErrorMessage = string | ((config: UploadsConfig) => string)

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

export type UploadsConfig = {
  contentTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  minFiles?: number
  expiresIn?: string | number
}

export type UploadTokenPayload = UploadsConfig & {
  operationName: string
}

export type RedwoodUploadsOptions = {
  appName: string
  uploadTarget?: string
  uploadTokenHeaderName?: string
  errorMessages?: UploadErrorMessages
}
