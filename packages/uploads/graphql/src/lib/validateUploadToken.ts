import jwt from 'jsonwebtoken'

import type { GlobalContext } from '@redwoodjs/context'
import { AuthenticationError, ValidationError } from '@redwoodjs/graphql-server'

import type { UploadErrorMessage } from '..'
import { DEFAULT_UPLOAD_TOKEN_HEADER_NAME } from '../constants'
import type {
  UploadErrorMessages,
  RedwoodUploadsOptions,
  UploadsConfig,
} from '../types'

export type RedwoodUploadContext = GlobalContext & {
  useRedwoodUploadErrorMessages?: UploadErrorMessages
  useRedwoodUploadTokenHeaderName?: RedwoodUploadsOptions['uploadTokenHeaderName']
  useRedwoodUploadTarget?: RedwoodUploadsOptions['uploadTarget']
  useRedwoodUploadAppName?: RedwoodUploadsOptions['appName']
}

type ValidateUploadConditionProps = {
  isConditionMet: boolean
  errorMessage: UploadErrorMessage
  errorMessageParams?: Record<
    string,
    string | number | boolean | string[] | undefined
  >
  // defaultMessage: string
  isAuthenticationError?: boolean
}

const validateUploadCondition = ({
  isConditionMet: condition,
  errorMessage,
  errorMessageParams: params = {},
  isAuthenticationError = false,
}: ValidateUploadConditionProps) => {
  const UploadError = isAuthenticationError
    ? AuthenticationError
    : ValidationError

  if (condition) {
    if (typeof errorMessage === 'function') {
      const message = errorMessage(params)
      throw new UploadError(message)
    }
    throw new UploadError(errorMessage)
  }
}

export const validateUploadToken = (
  context: RedwoodUploadContext,
): UploadsConfig => {
  const headers =
    (context.event as { headers?: Record<string, string> })?.headers || {}
  const { operationName } = context?.['params'] as { operationName: string }

  const uploadTokenHeaderName =
    context.useRedwoodUploadTokenHeaderName ?? DEFAULT_UPLOAD_TOKEN_HEADER_NAME
  const uploadToken = headers[
    uploadTokenHeaderName
  ] as RedwoodUploadsOptions['uploadTokenHeaderName']
  const errorMessages = context.useRedwoodUploadErrorMessages

  validateUploadCondition({
    isConditionMet: !operationName,
    errorMessage:
      errorMessages?.operationNameRequired ?? 'Operation name is required',
    errorMessageParams: {},
  })

  validateUploadCondition({
    isConditionMet: !uploadToken,
    errorMessage:
      errorMessages?.uploadTokenRequired ?? 'Upload token is required',
    errorMessageParams: {},
  })

  try {
    if (!uploadToken || !process.env.UPLOAD_TOKEN_SECRET) {
      throw new AuthenticationError('Upload token is required')
    }
    const decodedToken = jwt.verify(
      uploadToken,
      process.env.UPLOAD_TOKEN_SECRET,
      {
        algorithms: ['HS256'],
        audience: context.useRedwoodUploadTarget,
        issuer: context.useRedwoodUploadAppName,
        subject: operationName,
      },
    )

    // cast to UploadsConfig because the JWT has custom claims
    return decodedToken as UploadsConfig
  } catch (error) {
    console.error('Error validating upload token', error)
    throw new AuthenticationError('Authentication failed: Invalid upload token')
  }
}

export const validateFiles = (
  files: File[],
  { minFiles, maxFiles, contentTypes, maxFileSize }: UploadsConfig,
  context: RedwoodUploadContext,
) => {
  const fileCount = files.length

  const errorMessages = context.useRedwoodUploadErrorMessages

  validateUploadCondition({
    isConditionMet: minFiles !== undefined && fileCount < minFiles,
    errorMessage:
      errorMessages?.tooFewFiles ??
      `Too few files. Min ${minFiles} files required`,
    errorMessageParams: { minFiles },
  })

  validateUploadCondition({
    isConditionMet: maxFiles !== undefined && fileCount > maxFiles,
    errorMessage:
      errorMessages?.tooManyFiles ??
      `Too many files. Max ${maxFiles} files allowed`,
    errorMessageParams: { maxFiles },
  })

  files.forEach((file) => {
    validateUploadCondition({
      isConditionMet: !!contentTypes && !contentTypes.includes(file.type),
      errorMessage:
        errorMessages?.invalidFileType ??
        `Invalid file type. Allowed types: ${contentTypes?.join(', ')}`,
      errorMessageParams: { contentTypes },
    })

    validateUploadCondition({
      isConditionMet: maxFileSize !== undefined && file.size > maxFileSize,
      errorMessage:
        errorMessages?.tooLargeFile ??
        `File size exceeds the maximum allowed size. Max size: ${maxFileSize} bytes`,
      errorMessageParams: { maxFileSize },
    })
  })
}
