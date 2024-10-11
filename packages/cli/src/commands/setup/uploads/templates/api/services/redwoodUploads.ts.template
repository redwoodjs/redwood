import { createUploadToken } from '@redwoodjs/uploads-graphql'
import type { UploadTokenPayload } from '@redwoodjs/uploads-graphql'

import type { GetRedwoodUploadTokenResolver } from './types'
export const getRedwoodUploadToken: GetRedwoodUploadTokenResolver = async ({
  operationName,
}) => {
  if (!process.env.UPLOAD_TOKEN_SECRET) {
    throw new Error('UPLOAD_TOKEN_SECRET is not set')
  }

  // Note: based on the operation name, we could configure the content types, max file size, etc

  const payload: UploadTokenPayload = {
    operationName,
    minFiles: 2,
    maxFiles: 3,
    expiresIn: 24 * 60 * 60,
    maxFileSize: 1 * 1024 * 1024, // 1MB
  }

  const token = createUploadToken(payload)

  return { token }
}
