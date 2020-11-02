import { GraphQLError } from 'graphql'

export declare type OperationVariables = Record<string, any>

export declare class GqlError extends Error {
  message: string
  graphQLErrors: ReadonlyArray<GraphQLError>
  extraInfo?: any

  constructor({
    graphQLErrors,
    errorMessage,
    extraInfo,
  }: {
    graphQLErrors?: ReadonlyArray<GraphQLError>
    errorMessage?: string
    extraInfo?: any
  })
}

export interface QueryResult<TData = any> {
  data: TData | undefined
  error?: GqlError
  loading: boolean
}

export interface MutationResult<TData = any> {
  data?: TData | null
  error?: GqlError
  loading: boolean
}

export interface BaseQueryOptions<TVariables = OperationVariables> {
  variables?: TVariables
}

export * from './GraphQLContext'
export * from './useQuery'
export * from './useMutation'
export { withCell } from './withCell'