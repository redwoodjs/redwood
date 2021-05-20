import type { DocumentNode } from 'graphql'

export interface GraphQLHookOptions {
  variables?: Record<string, any>
  refetchQueries?: { query: DocumentNode; variables?: Record<string, any> }[]
  onCompleted?: (data: any) => void
  [key: string]: any
}
export interface GraphQLHooks {
  useQuery: (
    query: DocumentNode,
    options?: GraphQLHookOptions
  ) => QueryOperationResult
  useMutation: (
    mutation: DocumentNode,
    options?: GraphQLHookOptions
  ) => MutationOperationResult
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

/**
 * GraphQLHooksProvider stores standard `useQuery` and `useMutation` hooks for Redwood
 * that can be mapped to your GraphQL library of choice's own `useQuery`
 * and `useMutation` implementation.
 *
 * @todo Let the user pass in the additional type for options.
 */
export const GraphQLHooksProvider: React.FunctionComponent<GraphQLHooks> = ({
  useQuery,
  useMutation,
  children,
}) => {
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

export function useQuery(query: DocumentNode, options?: GraphQLHookOptions) {
  return React.useContext(GraphQLHooksContext).useQuery(query, options)
}

export function useMutation(
  mutation: DocumentNode,
  options?: GraphQLHookOptions
) {
  return React.useContext(GraphQLHooksContext).useMutation(mutation, options)
}
