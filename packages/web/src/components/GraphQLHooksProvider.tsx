import type { DocumentNode } from 'graphql'

type DefaultUseQueryType = <
  TData = any,
  TVariables = GraphQLOperationVariables
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
export interface GraphQLHooks<
  TuseQuery = DefaultUseQueryType,
  TuseMutation = DefaultUseMutationType
> {
  useQuery: TuseQuery
  useMutation: TuseMutation
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
})

interface GraphQlHooksProviderProps<
  TuseQuery = DefaultUseQueryType,
  TuseMutation = DefaultUseMutationType
> extends GraphQLHooks<TuseQuery, TuseMutation> {
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
  children,
}: GraphQlHooksProviderProps<TuseQuery, TuseMutation>) => {
  return (
    <GraphQLHooksContext.Provider
      value={{
        useQuery,
        useMutation,
      }}
    >
      {children}
    </GraphQLHooksContext.Provider>
  )
}

export function useQuery<TData = any, TVariables = GraphQLOperationVariables>(
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
