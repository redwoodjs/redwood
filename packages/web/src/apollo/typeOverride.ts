// Override useQuery and useMutation types
import type { QueryResult, MutationTuple } from '@apollo/client'

declare global {
  interface QueryOperationResult extends QueryResult {}
  interface MutationOperationResult<TData, TVariables>
    extends MutationTuple<TData, TVariables> {}
}

export {}
