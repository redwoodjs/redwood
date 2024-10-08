import jwt from 'jsonwebtoken'

import type { GlobalContext } from '@redwoodjs/context'
import {
  createValidatorDirective,
  AuthenticationError,
  ValidationError,
  ValidatorDirectiveFunc,
} from '@redwoodjs/graphql-server'
import { DEFAULT_UPLOAD_TOKEN_HEADER_NAME } from '@redwoodjs/upload'
import type { UploadConfig, UploadErrorMessages } from '@redwoodjs/upload'

import { logger } from 'src/lib/logger'

export const schema = gql`
  """
  Use @upload to validate file uploads with dynamic input and size constraints.
  """
  directive @upload(variable: String!, fields: [String!]!) on FIELD_DEFINITION
`

const validateUploadToken = (context: GlobalContext) => {
  const headers = context.event?.['headers'] || {}
  const { operationName } = context?.['params'] as { operationName: string }

  const uploadTokenHeaderName =
    context.useRedwoodUploadTokenHeaderName ?? DEFAULT_UPLOAD_TOKEN_HEADER_NAME

  const errorMessages =
    context.useRedwoodUploadErrorMessages as UploadErrorMessages

  if (!operationName) {
    if (errorMessages.operationNameRequired) {
      if (typeof errorMessages.operationNameRequired === 'function') {
        throw new ValidationError(errorMessages.operationNameRequired({}))
      }
      throw new ValidationError(errorMessages.operationNameRequired)
    }
    throw new ValidationError('Operation name is required')
  }

  const uploadToken = headers[uploadTokenHeaderName]

  if (!uploadToken) {
    if (errorMessages.uploadTokenRequired) {
      if (typeof errorMessages.uploadTokenRequired === 'function') {
        throw new ValidationError(errorMessages.uploadTokenRequired({}))
      }
      throw new ValidationError(errorMessages.uploadTokenRequired)
    }
    throw new ValidationError('Upload token is required')
  }

  try {
    const decodedToken = jwt.verify(
      uploadToken,
      process.env.UPLOAD_TOKEN_SECRET,
      {
        algorithms: ['HS256'],
        audience: context.useRedwoodUploadTarget,
        issuer: context.useRedwoodUploadAppName,
        subject: operationName,
      }
    )
    logger.debug({ decodedToken }, 'Decoded upload token')
    return decodedToken
  } catch (error) {
    logger.error({ error }, 'JWT verification failed')
    if (errorMessages.invalidUploadToken) {
      if (typeof errorMessages.invalidUploadToken === 'function') {
        throw new ValidationError(errorMessages.invalidUploadToken({}))
      }
      throw new ValidationError(errorMessages.invalidUploadToken)
    }
    throw new AuthenticationError('Authentication failed: Invalid upload token')
  }
}

const validateFiles = (
  files: File[],
  { minFiles, maxFiles, contentTypes, maxFileSize }: UploadConfig
) => {
  const fileCount = files.length

  const errorMessages =
    context.useRedwoodUploadErrorMessages as UploadErrorMessages

  if (minFiles !== undefined && fileCount < minFiles) {
    logger.error({ minFiles, fileCount }, 'Too few files')
    if (errorMessages.tooFewFiles) {
      if (typeof errorMessages.tooFewFiles === 'function') {
        throw new ValidationError(errorMessages.tooFewFiles({ minFiles }))
      }
      throw new ValidationError(errorMessages.tooFewFiles)
    }
    throw new ValidationError(`Too few files. Min ${minFiles} files required`)
  }

  if (maxFiles !== undefined && fileCount > maxFiles) {
    logger.error({ maxFiles, fileCount }, 'Too many files')
    if (errorMessages.tooManyFiles) {
      if (typeof errorMessages.tooManyFiles === 'function') {
        throw new ValidationError(errorMessages.tooManyFiles({ maxFiles }))
      }
      throw new ValidationError(errorMessages.tooManyFiles)
    }

    throw new ValidationError(`Too many files. Max ${maxFiles} files allowed`)
  }

  files.forEach((file) => {
    if (contentTypes && !contentTypes.includes(file.type)) {
      logger.error({ contentTypes }, 'Invalid file type')
      if (errorMessages.invalidFileType) {
        if (typeof errorMessages.invalidFileType === 'function') {
          throw new ValidationError(
            errorMessages.invalidFileType({ contentTypes })
          )
        }
        throw new ValidationError(errorMessages.invalidFileType)
      }
      throw new ValidationError(
        `Invalid file type. Allowed types: ${contentTypes.join(', ')}`
      )
    }

    if (maxFileSize !== undefined && file.size > maxFileSize) {
      logger.error(
        { size: file.size, maxFileSize },
        'File size exceeds the maximum allowed size'
      )
      if (errorMessages.tooLargeFile) {
        if (typeof errorMessages.tooLargeFile === 'function') {
          throw new ValidationError(errorMessages.tooLargeFile({ maxFileSize }))
        }
        throw new ValidationError(errorMessages.tooLargeFile)
      }

      throw new ValidationError(
        `File size exceeds the maximum allowed size. Max size: ${maxFileSize} bytes`
      )
    }
  })
}

const validate: ValidatorDirectiveFunc = ({ directiveArgs, args, context }) => {
  const { variable, fields } = directiveArgs

  const uploadConfig = validateUploadToken(context) as UploadConfig

  try {
    const inputVariable = args[variable]

    if (!inputVariable) {
      throw new ValidationError('Input variable for files is required')
    }

    fields.forEach((field) => {
      const files = inputVariable[field] as File[]
      validateFiles(files, uploadConfig)
    })
  } catch (error) {
    logger.error({ error }, 'Upload validation failed')
    throw new ValidationError(error.message)
  }
}

const upload = createValidatorDirective(schema, validate)

export default upload
