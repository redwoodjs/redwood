import type {
  DocumentNode,
  MutationHookOptions,
  TypedDocumentNode,
} from '@apollo/client'
import { gql } from 'graphql-tag'

import { useQuery, useMutation } from '@redwoodjs/web'
// Define the query to get the upload token
const GET_REDWOOD_UPLOAD_TOKEN = gql`
  query GetRedwoodUploadToken($operationName: String!) {
    uploadToken: getRedwoodUploadToken(operationName: $operationName) {
      token
    }
  }
`

export type UploadTokenOptions = {
  uploadTokenHeaderName?: string
}

export type UseUploadsMutationOptions = {
  mutation: DocumentNode | TypedDocumentNode<any, any>
  options?: MutationHookOptions
  uploadTokenOptions?: UploadTokenOptions
}

export const DEFAULT_UPLOAD_TOKEN_HEADER_NAME = 'x-rw-upload-token'

// Function to retrieve the upload token
export const useUploadToken = (operationName: string) => {
  const { data } = useQuery(GET_REDWOOD_UPLOAD_TOKEN, {
    variables: { operationName },
    skip: !operationName, // Skip the query if the operation name is not available
  })

  return data?.uploadToken?.token
}

// Function to extract the mutation name from the mutation document
export const getMutationName = (
  mutation: DocumentNode | TypedDocumentNode<any, any>,
) => {
  const operationDef = mutation.definitions[0]
  const mutationName =
    operationDef && 'name' in operationDef
      ? operationDef.name?.value
      : undefined

  if (!mutationName) {
    throw new Error('Mutation name is required')
  }

  return mutationName
}

// Function to get the upload token header name
export const getUploadTokenHeaderName = (
  uploadTokenOptions?: UploadTokenOptions,
) => {
  return (
    uploadTokenOptions?.uploadTokenHeaderName ??
    DEFAULT_UPLOAD_TOKEN_HEADER_NAME
  )
}

export const useUploadsMutation = (
  mutation: UseUploadsMutationOptions['mutation'],
  options: UseUploadsMutationOptions['options'] = {},
  uploadTokenOptions: UseUploadsMutationOptions['uploadTokenOptions'] = {},
) => {
  const mutationName = getMutationName(mutation)

  // Retrieve the upload token header name using the new function
  const uploadTokenHeaderName = getUploadTokenHeaderName(uploadTokenOptions)

  // Retrieve the token
  const token = useUploadToken(mutationName)

  // Customize the useMutation hook to include the upload token in the headers
  const result = useMutation(mutation, {
    ...options,
    context: {
      ...options?.context,
      headers: {
        ...options?.context?.headers,
        [uploadTokenHeaderName]: token,
      },
    },
  })

  return result
}
