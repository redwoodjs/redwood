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
  type QueryOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
  > = QueryResult<TData, TVariables>

  type MutationOperationResult<TData, TVariables> = MutationTuple<
    TData,
    TVariables
  >

  type SubscriptionOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
  > = SubscriptionResult<TData, TVariables>

  type GraphQLQueryHookOptions<
    TData,
    TVariables extends OperationVariables,
  > = QueryHookOptions<TData, TVariables>

  type GraphQLMutationHookOptions<TData, TVariables> = MutationHookOptions<
    TData,
    TVariables
  >

  type GraphQLSubscriptionHookOptions<
    TData,
    TVariables extends OperationVariables,
  > = SubscriptionHookOptions<TData, TVariables>

  type SuspenseQueryOperationResult<
    TData = any,
    TVariables extends OperationVariables = OperationVariables,
  > = UseSuspenseQueryResult<TData, TVariables>

  type GraphQLSuspenseQueryHookOptions<
    TData,
    TVariables extends OperationVariables,
  > = SuspenseQueryHookOptions<TData, TVariables>
}

export {}
