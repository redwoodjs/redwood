import type { DocumentNode } from 'graphql'

export interface QueryHookOptions {
  variables?: Record<string, any>
}
export interface QueryResult<TData = any> {
  data: TData | undefined
  loading: boolean
  error?: Error
}

export interface QueryHooks {
  mapUseQueryHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => QueryResult
  mapUseMutationHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => QueryResult
}
export const QueryHooksContext = React.createContext<QueryHooks>({
  mapUseQueryHook: () => {
    throw new Error(
      'You must register a useQuery hook via the `QueryHooksProvider`'
    )
  },
  mapUseMutationHook: () => {
    throw new Error(
      'You must register a useQuery hook via the `QueryHooksProvider`'
    )
  },
})

/**
 * QueryHooksProvider stores a standard `useQuery` hook for Redwood
 * that can be mapped to your GraphQL library of choice's own `useQuery`
 * implementation.
 *
 * @todo Let the user pass in the additional option types.
 */
export const QueryHooksProvider: React.FunctionComponent<{
  registerUseQueryHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => QueryResult
  registerUseMutationHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => QueryResult
}> = ({ registerUseQueryHook, registerUseMutationHook, children }) => {
  return (
    <QueryHooksContext.Provider
      value={{
        mapUseQueryHook: registerUseQueryHook,
        mapUseMutationHook: registerUseMutationHook,
      }}
    >
      {children}
    </QueryHooksContext.Provider>
  )
}

export function useQuery<TData = any>(
  query: DocumentNode,
  options?: QueryHookOptions
): QueryResult<TData> {
  return React.useContext(QueryHooksContext).mapUseQueryHook(query, options)
}

export function useMutation<TData = any>(
  query: DocumentNode,
  options?: QueryHookOptions
): QueryResult<TData> {
  return React.useContext(QueryHooksContext).mapUseMutationHook(query, options)
}
