import type { DocumentNode } from 'graphql'

export interface GraphQLHookOptions {
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

export interface GraphQLHooks {
  mapUseQueryHook: (
    query: DocumentNode,
    options?: GraphQLHookOptions
  ) => OperationResult
  mapUseMutationHook: (
    mutation: DocumentNode,
    options?: GraphQLHookOptions
  ) => MutationOperationResult
}
export const GraphQLHooksContext = React.createContext<GraphQLHooks>({
  mapUseQueryHook: () => {
    throw new Error(
      'You must register a useQuery hook via the `GraphQLHooksProvider`'
    )
  },
  mapUseMutationHook: () => {
    throw new Error(
      'You must register a useMutation hook via the `GraphQLHooksProvider`'
    )
  },
})

/**
 * GraphQLHooksProvider stores a standard `useQuery` hook for Redwood
 * that can be mapped to your GraphQL library of choice's own `useQuery`
 * and `useMutation` implementation.
 *
 * @todo Let the user pass in the additional type for options.
 */
export const GraphQLHooksProvider: React.FunctionComponent<{
  registerUseQueryHook: (
    query: DocumentNode,
    options?: GraphQLHookOptions
  ) => OperationResult
  registerUseMutationHook: (
    mutation: DocumentNode,
    options?: GraphQLHookOptions
  ) => MutationOperationResult
}> = ({ registerUseQueryHook, registerUseMutationHook, children }) => {
  return (
    <GraphQLHooksContext.Provider
      value={{
        mapUseQueryHook: registerUseQueryHook,
        mapUseMutationHook: registerUseMutationHook,
      }}
    >
      {children}
    </GraphQLHooksContext.Provider>
  )
}

export function useQuery<TData = any>(
  query: DocumentNode,
  options?: GraphQLHookOptions
): OperationResult<TData> {
  return React.useContext(GraphQLHooksContext).mapUseQueryHook(query, options)
}

export function useMutation<TData = any>(
  mutation: DocumentNode,
  options?: GraphQLHookOptions
): MutationOperationResult<TData> {
  return React.useContext(GraphQLHooksContext).mapUseMutationHook(
    mutation,
    options
  )
}
