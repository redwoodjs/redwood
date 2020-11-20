// Operation: GQL thingum.
// Variables,
// Other options.

/**
 * The QueryHooksProvider allows you to register and map a 3rd party `useQuery` hook
 * in Redwood. You supply the hook by mapping the arguments and the return values
 * to what we expect in Redwood.
 *
 *
 */

import type { DocumentNode } from 'graphql'

export interface QueryHookOptions {
  variables: Record<string, any>
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
}
export const QueryHooksContext = React.createContext<QueryHooks>({
  mapUseQueryHook: () => {
    throw new Error('You must register a useQuery via the `QueryHooksProvider`')
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
}> = ({ registerUseQueryHook, children }) => {
  return (
    <QueryHooksContext.Provider
      value={{ mapUseQueryHook: registerUseQueryHook }}
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
