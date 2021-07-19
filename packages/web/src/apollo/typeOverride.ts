// Override useQuery and useMutation types
import type {
  QueryHookOptions,
  QueryResult,
  MutationHookOptions,
  MutationTuple,
} from '@apollo/client'

export interface GraphQLQueryHookOptions extends QueryHookOptions {}
export interface GraphQLMutationHookOptions extends MutationHookOptions {}
declare global {
  interface QueryOperationResult extends QueryResult {}
  interface MutationOperationResult<TData, TVariables>
    extends MutationTuple<TData, TVariables> {}
}

export {}
