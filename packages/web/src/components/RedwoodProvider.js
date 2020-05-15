import { useState, useEffect } from 'react'

import { GraphQLProvider, createGraphQLClient } from 'src/graphql'

const useAuthStub = () => ({ loading: false, authenticated: false })

/**
 * Redwood's Provider is a zeroconf way to tie together authentication and
 * GraphQL requests.
 *
 * When the `useAuth` hook from `@redwoodjs/auth` is available the authentication
 * token is automatically added to the Authorization headers of each GraphQL request.
 */
const RedwoodProvider = ({
  useAuth = window.__REDWOOD__USE_AUTH || useAuthStub,
  children,
}) => {
  const { loading, authenticated, getToken, type } = useAuth()
  const [authToken, setAuthToken] = useState()

  useEffect(() => {
    if (authenticated) {
      getToken().then((token) => setAuthToken(token))
    }
  }, [authenticated, getToken])

  // This really sucks because rendering is completely blocked whilst we're
  // restoring authentication.
  if (loading) {
    return null
  }
  // If we have an authToken then modify the headers of the GraphQL client.
  // TODO: Add a way for user's to pass in custom headers to GraphQL, or just a custom client.
  const client = authToken
    ? createGraphQLClient({
        headers: {
          // Used by `api` to determine the auth type.
          'auth-provider': type,
          authorization: `Bearer ${authToken}`,
        },
      })
    : undefined

  return <GraphQLProvider client={client}>{children}</GraphQLProvider>
}

export default RedwoodProvider
