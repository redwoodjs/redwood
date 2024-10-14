import type { SignOptions } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'

import { context } from '@redwoodjs/context'

import {
  IMAGE_CONTENT_TYPES,
  DOCUMENT_CONTENT_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
  MIN_FILES,
  EXPIRES_IN,
  DEFAULT_UPLOAD_APP_NAME,
  DEFAULT_UPLOAD_TARGET,
} from '../constants'
import type { UploadsConfig, UploadTokenPayload } from '../types'

const DEFAULT_UPLOADS_CONFIG: UploadsConfig = {
  contentTypes: [...IMAGE_CONTENT_TYPES, ...DOCUMENT_CONTENT_TYPES],
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
  const finalPayload = { ...DEFAULT_UPLOADS_CONFIG, ...uploadConfig }
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
