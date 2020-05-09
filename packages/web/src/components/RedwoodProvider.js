import { useState, useEffect } from 'react'

import { GraphQLProvider, createGraphQLClient } from 'src/graphql'

const useAuthStub = () => ({ loading: false, authenticated: false })

/**
 * Redwood's Provider ties together our authentication and Apollo's GraphQL Provider
 * when you pass the `useAuth` hook from `@redwoodjs/auth`
 * The authentication token is added to the headers of the GraphQL client.
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
  const client = authToken
    ? createGraphQLClient({
        headers: {
          // Used by `api` to determine the auth type.
          'X-Redwood-Auth-Type': type,
          Authorization: `Bearer ${authToken}`,
        },
      })
    : undefined

  return <GraphQLProvider client={client}>{children}</GraphQLProvider>
}

export default RedwoodProvider
