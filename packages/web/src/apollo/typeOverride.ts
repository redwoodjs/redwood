// Override useQuery and useMutation types
import type {
  QueryHookOptions,
  QueryResult,
  MutationHookOptions,
  MutationTuple,
  OperationVariables,
  SubscriptionHookOptions,
  SubscriptionResult,
  UseSuspenseQueryResult,
  SuspenseQueryHookOptions,
} from '@apollo/client'

// @MARK: Override relevant types from Apollo here
declare global {
  interface QueryOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables
  > extends QueryResult<TData, TVariables> {}

  interface MutationOperationResult<TData, TVariables>
    extends MutationTuple<TData, TVariables> {}

  interface SubscriptionOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables
  > extends SubscriptionResult<TData, TVariables> {}

  interface GraphQLQueryHookOptions<
    TData,
    TVariables extends OperationVariables
  > extends QueryHookOptions<TData, TVariables> {}

  interface GraphQLMutationHookOptions<TData, TVariables>
    extends MutationHookOptions<TData, TVariables> {}

  interface GraphQLSubscriptionHookOptions<
    TData,
    TVariables extends OperationVariables
  > extends SubscriptionHookOptions<TData, TVariables> {}

  interface SuspenseQueryOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables
  > extends UseSuspenseQueryResult<TData, TVariables> {}

  interface GraphQLSuspenseQueryHookOptions<
    TData,
    TVariables extends OperationVariables
  > extends SuspenseQueryHookOptions<TData, TVariables> {}
}

export {}
