import type { Plugin } from 'graphql-yoga'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

import type { RedwoodGraphQLContext } from '@redwoodjs/graphql-server'

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

export const DEFAULT_UPLOAD_APP_NAME = 'RedwoodApp'
export const DEFAULT_UPLOAD_TOKEN_HEADER_NAME = 'x-rw-upload-token'
export const DEFAULT_UPLOAD_TARGET = 'RedwoodUpload'

// set sensible defaults for content types, max file size, etc
// export const APP_NAME = 'pixeez'
// Represents where the upload is intended for to
//signify that it's for the upload functionality of your app,
// such as 'uploads'.
// export const UPLOAD_TARGET = 'uploads'
const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const PDF_CONTENT_TYPE = 'application/pdf'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_FILES = 20
const MIN_FILES = 1
const EXPIRES_IN = '1hr'

const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  contentTypes: [...IMAGE_CONTENT_TYPES, PDF_CONTENT_TYPE],
  maxFileSize: MAX_FILE_SIZE,
  maxFiles: MAX_FILES,
  minFiles: MIN_FILES,
  expiresIn: EXPIRES_IN,
}

export const createUploadToken = (payload: UploadTokenPayload) => {
  const secret = process.env.UPLOAD_TOKEN_SECRET

  if (!secret) {
    throw new Error('UPLOAD_TOKEN_SECRET is not set')
  }

  const { operationName, ...uploadConfig } = payload

  // merge the payload with the default payload
  const finalPayload = { ...DEFAULT_UPLOAD_CONFIG, ...uploadConfig }
  const { expiresIn = EXPIRES_IN, ...finalPayloadWithoutExpiresIn } =
    finalPayload

  const issuer = context.useRedwoodUploadAppName ?? DEFAULT_UPLOAD_APP_NAME
  const audience = context.useRedwoodUploadTarget ?? DEFAULT_UPLOAD_TARGET

  return jwt.sign(finalPayloadWithoutExpiresIn, secret, {
    algorithm: 'HS256',
    audience,
    issuer,
    expiresIn,
    subject: operationName,
  } as SignOptions)
}

export const useRedwoodUpload = (
  options: RedwoodUploadOptions,
): Plugin<RedwoodGraphQLContext> => {
  return {
    async onContextBuilding({ extendContext }) {
      const { appName, uploadTarget, uploadTokenHeaderName, errorMessages } =
        options

      extendContext({
        useRedwoodUploadAppName: appName,
        useRedwoodUploadTarget: uploadTarget,
        useRedwoodUploadTokenHeaderName:
          uploadTokenHeaderName ?? DEFAULT_UPLOAD_TOKEN_HEADER_NAME,
        useRedwoodUploadErrorMessages: errorMessages,
      })
    },
  }
}
