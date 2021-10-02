// Override useQuery and useMutation types
import type {
  QueryHookOptions,
  QueryResult,
  MutationHookOptions,
  MutationTuple,
} from '@apollo/client'

// @MARK: Override relevant types from Apollo here
declare global {
  interface QueryOperationResult<TData = any, TVariables = any>
    extends QueryResult<TData, TVariables> {}
  interface MutationOperationResult<TData, TVariables>
    extends MutationTuple<TData, TVariables> {}

  interface GraphQLQueryHookOptions<TData = any, TVariables = any>
    extends QueryHookOptions<TData, TVariables> {}
  interface GraphQLMutationHookOptions<TData = any, TVariables = any>
    extends MutationHookOptions<TData, TVariables> {}
}

export {}
