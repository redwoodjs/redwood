import { RedwoodStorageFormat } from 'types/graphql'

import {
  createTransformerDirective,
  TransformerDirectiveFunc,
} from '@redwoodjs/graphql-server'

import { logger } from 'src/lib/logger'
import { storage } from 'src/lib/storage'
export const schema = gql`
  """
  Use @withStorage to fetch data from storage as a signed URL or data URI.
  """
  enum RedwoodStorageFormat {
    SIGNED_URL
    DATA_URI
  }

  directive @withStorage(
    format: RedwoodStorageFormat = SIGNED_URL
  ) on FIELD_DEFINITION
`

export const getBase64DataUri = async (reference: string): Promise<string> => {
  try {
    const file = await storage.readFile(reference)
    const base64Data = Buffer.from(await file.arrayBuffer()).toString('base64')
    const mimeType = file.type

    const dataUri = `data:${mimeType};base64,${base64Data}`
    return dataUri
  } catch (error) {
    logger.error({ error, reference }, 'Error creating base64 data URI')
    throw error
  }
}

const transform: TransformerDirectiveFunc = async ({
  directiveArgs,
  resolvedValue,
}) => {
  if (
    !resolvedValue ||
    typeof resolvedValue !== 'string' ||
    resolvedValue.length === 0
  ) {
    return null
  }

  const format = directiveArgs.format as RedwoodStorageFormat

  try {
    if (format === 'SIGNED_URL') {
      return await storage.getSignedUrl(resolvedValue)
    }

    if (format === 'DATA_URI') {
      return await getBase64DataUri(resolvedValue)
    }

    return resolvedValue
  } catch (error) {
    logger.error({ error, resolvedValue }, 'Error in withStorage directive')
    throw new Error('Failed to process storage directive')
  }
}

const withStorage = createTransformerDirective(schema, transform)

export default withStorage
