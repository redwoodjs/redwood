import type { DocumentNode } from 'graphql'

type DefaultUseQueryType = (
  query: DocumentNode,
  options?: GraphQLQueryHookOptions
) => QueryOperationResult

type DefaultUseMutationType = (
  mutation: DocumentNode,
  options?: GraphQLMutationHookOptions
) => MutationOperationResult
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

export function useQuery<TData = any>(
  query: DocumentNode,
  options?: GraphQLQueryHookOptions
): QueryOperationResult<TData> {
  return React.useContext(GraphQLHooksContext).useQuery(query, options)
}

export function useMutation<TData = any>(
  mutation: DocumentNode,
  options?: GraphQLMutationHookOptions
): MutationOperationResult<TData> {
  return React.useContext(GraphQLHooksContext).useMutation(mutation, options)
}
