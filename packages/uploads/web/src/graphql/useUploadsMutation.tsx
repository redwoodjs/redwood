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

export const useUploadsMutation = (
  mutation: UseUploadsMutationOptions['mutation'],
  options: UseUploadsMutationOptions['options'] = {},
  uploadTokenOptions: UseUploadsMutationOptions['uploadTokenOptions'] = {},
) => {
  // Extract the mutation name from the mutation document
  const operationDef = mutation.definitions[0]
  const mutationName =
    operationDef && 'name' in operationDef
      ? operationDef.name?.value
      : undefined

  if (!mutationName) {
    throw new Error('Mutation name is required')
  }

  // Use the getRedwoodUploadToken query to get the JWT token
  const {
    data,
    //loading, error
  } = useQuery(GET_REDWOOD_UPLOAD_TOKEN, {
    variables: { operationName: mutationName },
    skip: !mutationName, // Skip the query if the mutation name is not available
  })

  const uploadTokenHeaderName =
    uploadTokenOptions?.uploadTokenHeaderName ??
    DEFAULT_UPLOAD_TOKEN_HEADER_NAME

  // Retrieve the token
  const token = data?.uploadToken?.token

  // Customize the useMutation hook to include the upload token in the headers
  const result = useMutation(mutation, {
    ...options,
    context: {
      headers: {
        ...options?.['context']?.headers,
        [uploadTokenHeaderName]: token,
      },
    },
  })

  return result
}
