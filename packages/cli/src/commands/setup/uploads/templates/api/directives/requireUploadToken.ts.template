import type { DirectiveParams } from '@redwoodjs/graphql-server'
import {
  createValidatorDirective,
  ValidationError,
  ValidatorDirectiveFunc,
} from '@redwoodjs/graphql-server'
import { validateUploadToken, validateFiles } from '@redwoodjs/uploads-graphql'
import type { RedwoodUploadContext } from '@redwoodjs/uploads-graphql'

import { logger } from 'src/lib/logger'

export const schema = gql`
  """
  Use @requireUploadToken to validate file uploads with dynamic input and size constraints.
  """
  directive @requireUploadToken(
    variable: String!
    fields: [String!]!
  ) on FIELD_DEFINITION
`

const validate: ValidatorDirectiveFunc = ({
  directiveArgs,
  args,
  context,
}: {
  directiveArgs: DirectiveParams['directiveArgs']
  args: DirectiveParams['args']
  context: RedwoodUploadContext
}) => {
  const { variable, fields } = directiveArgs

  const uploadsConfig = validateUploadToken(context)

  try {
    const inputVariable = args[variable]

    if (!inputVariable) {
      throw new ValidationError('Input variable for files is required')
    }

    fields.forEach((field) => {
      const files = inputVariable[field] as File[]
      validateFiles(files, uploadsConfig, context)
    })
  } catch (error) {
    logger.warn({ error }, 'Upload validation failed')
    throw new ValidationError(error.message)
  }
}

const requireUploadToken = createValidatorDirective(schema, validate)

export default requireUploadToken
