import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations'
import type { CustomPersistedQueryErrors } from '@graphql-yoga/plugin-persisted-operations'
import type { Plugin } from 'graphql-yoga'

import type { RedwoodGraphQLContext } from '../types'

export type RedwoodTrustedDocumentOptions = {
  store: Record<string, string>
  disabled?: boolean
  customErrors?: CustomPersistedQueryErrors
}

const REDWOOD__AUTH_GET_CURRENT_USER_QUERY =
  '{"query":"query __REDWOOD__AUTH_GET_CURRENT_USER { redwood { currentUser } }"}'

/**
 * When using Redwood Auth, we want to allow the known, trusted `redwood.currentUser` query to be
 * executed without a persisted operation.
 *
 * This is because the `currentUser` query is a special case that is used to get
 * the current user from the auth provider.
 *
 * This function checks if the request is for the `currentUser` query and has the correct headers
 * which are set by the useCurrentUser hook in the auth package.
 *
 * The usePersistedOperations plugin relies on this function to determine if a request
 * should be allowed to execute via its allowArbitraryOperations option.
 */
const allowRedwoodAuthCurrentUserQuery = async (request: Request) => {
  const headers = request.headers
  const hasContentType = headers.get('content-type') === 'application/json'
  const hasAuthProvider = !!headers.get('auth-provider')
  const hasAuthorization = !!headers.get('authorization')
  const hasAllowedHeaders =
    hasContentType && hasAuthProvider && hasAuthorization

  const query = await request.text()
  const hasAllowedQuery = query === REDWOOD__AUTH_GET_CURRENT_USER_QUERY

  return hasAllowedHeaders && hasAllowedQuery
}

export const useRedwoodTrustedDocuments = (
  options: RedwoodTrustedDocumentOptions
): Plugin<RedwoodGraphQLContext> => {
  return usePersistedOperations({
    customErrors: {
      persistedQueryOnly: 'Use Trusted Only!',
      ...options.customErrors,
    },
    getPersistedOperation(sha256Hash: string) {
      return options.store[sha256Hash]
    },
    allowArbitraryOperations: async (request) => {
      return allowRedwoodAuthCurrentUserQuery(request)
    },
  })
}
