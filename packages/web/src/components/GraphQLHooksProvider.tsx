import { OperationVariables, UseSuspenseQueryResult } from '@apollo/client'
import type { DocumentNode } from 'graphql'

type DefaultUseQueryType = <
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  query: DocumentNode,
  options?: GraphQLQueryHookOptions<TData, TVariables>
) => QueryOperationResult<TData, TVariables>

type DefaultUseMutationType = <
  TData = any,
  TVariables = GraphQLOperationVariables
>(
  mutation: DocumentNode,
  options?: GraphQLMutationHookOptions<TData, TVariables>
) => MutationOperationResult<TData, TVariables>

type DefaultUseSubscriptionType = <
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  subscription: DocumentNode,
  options?: GraphQLSubscriptionHookOptions<TData, TVariables>
) => SubscriptionOperationResult<TData, TVariables>

type DefaultUseSuspenseType = <
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  query: DocumentNode,
  options?: GraphQLQueryHookOptions<TData, TVariables>
) => UseSuspenseQueryResult<TData, TVariables>

export interface GraphQLHooks<
  TuseQuery = DefaultUseQueryType,
  TuseMutation = DefaultUseMutationType,
  TuseSubscription = DefaultUseSubscriptionType,
  TuseSuspenseQuery = DefaultUseSuspenseType
> {
  useQuery: TuseQuery
  useMutation: TuseMutation
  useSubscription: TuseSubscription
  useSuspenseQuery: TuseSuspenseQuery
}

export const GraphQLHooksContext = React.createContext<GraphQLHooks>({
  useQuery: () => {
    throw new Error(
      'You must register a useQuery hook via the `GraphQLHooksProvider`'
    )
  },
  useMutation: () => {
    throw new Error(
      'You must register a useMutation hook via the `GraphQLHooksProvider`'
    )
  },
  useSubscription: () => {
    throw new Error(
      'You must register a useSubscription hook via the `GraphQLHooksProvider`'
    )
  },
  useSuspenseQuery: () => {
    throw new Error(
      'You must register a useSuspenseQuery hook via the `GraphQLHooksProvider`.'
    )
  },
})

interface GraphQlHooksProviderProps<
  TuseQuery = DefaultUseQueryType,
  TuseMutation = DefaultUseMutationType,
  TuseSubscription = DefaultUseSubscriptionType,
  TuseSuspenseQuery = DefaultUseSuspenseType
> extends GraphQLHooks<
    TuseQuery,
    TuseMutation,
    TuseSubscription,
    TuseSuspenseQuery
  > {
  children: React.ReactNode
}

/**
 * GraphQLHooksProvider stores standard `useQuery` and `useMutation` hooks for Redwood
 * that can be mapped to your GraphQL library of choice's own `useQuery`
 * and `useMutation` implementation.
 *
 * @todo Let the user pass in the additional type for options.
 */
export const GraphQLHooksProvider = <
  TuseQuery extends DefaultUseQueryType,
  TuseMutation extends DefaultUseMutationType
>({
  useQuery,
  useMutation,
  useSubscription,
  useSuspenseQuery,
  children,
}: GraphQlHooksProviderProps<TuseQuery, TuseMutation>) => {
  return (
    <GraphQLHooksContext.Provider
      value={{
        useQuery,
        useMutation,
        useSubscription,
        useSuspenseQuery,
      }}
    >
      {children}
    </GraphQLHooksContext.Provider>
  )
}

export function useQuery<
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  query: DocumentNode,
  options?: GraphQLQueryHookOptions<TData, TVariables>
): QueryOperationResult<TData, TVariables> {
  return React.useContext(GraphQLHooksContext).useQuery<TData, TVariables>(
    query,
    options
  )
}

export function useMutation<
  TData = any,
  TVariables = GraphQLOperationVariables
>(
  mutation: DocumentNode,
  options?: GraphQLMutationHookOptions<TData, TVariables>
): MutationOperationResult<TData, TVariables> {
  return React.useContext(GraphQLHooksContext).useMutation<TData, TVariables>(
    mutation,
    options
  )
}

export function useSubscription<
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  query: DocumentNode,
  options?: GraphQLSubscriptionHookOptions<TData, TVariables>
): SubscriptionOperationResult<TData, TVariables> {
  return React.useContext(GraphQLHooksContext).useSubscription<
    TData,
    TVariables
  >(query, options)
}

export function useSuspenseQuery<
  TData = any,
  TVariables extends OperationVariables = GraphQLOperationVariables
>(
  query: DocumentNode,
  options?: GraphQLQueryHookOptions<TData, TVariables>
): UseSuspenseQueryResult<TData, TVariables> {
  return React.useContext(GraphQLHooksContext).useSuspenseQuery<
    TData,
    TVariables
  >(query, options)
}
