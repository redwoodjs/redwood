import type { DocumentNode } from 'graphql'

export interface QueryHookOptions {
  variables?: Record<string, any>
}
export interface OperationResult<TData = any> {
  data?: TData | undefined
  loading: boolean
  error?: Error
}

export type MutationOperationResult<TData = any> = [
  (options?: any) => Promise<TData>,
  OperationResult<TData>
]

export interface QueryHooks {
  mapUseQueryHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => OperationResult
  mapUseMutationHook: (
    mutation: DocumentNode,
    options?: QueryHookOptions
  ) => MutationOperationResult
}
export const QueryHooksContext = React.createContext<QueryHooks>({
  mapUseQueryHook: () => {
    throw new Error(
      'You must register a useQuery hook via the `QueryHooksProvider`'
    )
  },
  mapUseMutationHook: () => {
    throw new Error(
      'You must register a useMutation hook via the `QueryHooksProvider`'
    )
  },
})

/**
 * QueryHooksProvider stores a standard `useQuery` hook for Redwood
 * that can be mapped to your GraphQL library of choice's own `useQuery`
 * and `useMutation` implementation.
 *
 * @todo Let the user pass in the additional type for options.
 */
export const QueryHooksProvider: React.FunctionComponent<{
  registerUseQueryHook: (
    query: DocumentNode,
    options?: QueryHookOptions
  ) => OperationResult
  registerUseMutationHook: (
    mutation: DocumentNode,
    options?: QueryHookOptions
  ) => MutationOperationResult
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
): OperationResult<TData> {
  return React.useContext(QueryHooksContext).mapUseQueryHook(query, options)
}

export function useMutation<TData = any>(
  mutation: DocumentNode,
  options?: QueryHookOptions
): MutationOperationResult<TData> {
  return React.useContext(QueryHooksContext).mapUseMutationHook(
    mutation,
    options
  )
}
