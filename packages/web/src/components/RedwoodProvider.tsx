import { ComponentProps, useEffect, useState } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'

import { FlashProvider } from '../flash'
import { GraphQLProvider } from '../graphql'

interface GraphWLProviderWithAuthProps
  extends Omit<RedwoodProviderProps, 'useAuth'> {
  useAuth(): AuthContextInterface
}

const GraphQLProviderWithAuth: React.FC<GraphWLProviderWithAuthProps> = ({
  useAuth,
  graphQLClientConfig = { headers: {} },
  children,
  ...rest
}) => {
  const { loading, isAuthenticated, getToken, type } = useAuth()
  const [authToken, setAuthToken] = useState<string | null>(null)

  useEffect(() => {
    const fetchAuthToken = async () => {
      const token = await getToken()
      setAuthToken(token)
    }

    if (isAuthenticated) {
      fetchAuthToken()
    }
  }, [isAuthenticated, getToken])

  // This really sucks because rendering is completely blocked whilst we're
  // restoring authentication. In a lot of cases that's OK since the token is stored
  // in localstorage or a secure cookie.
  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return (
      <GraphQLProvider config={graphQLClientConfig} {...rest}>
        {children}
      </GraphQLProvider>
    )
  }

  // The user is authenticated, so we have to wait for the auth token to be retrieved
  // before continueing.
  if (!authToken) {
    return null
  }

  return (
    <GraphQLProvider
      config={{
        ...graphQLClientConfig,
        headers: {
          /** `auth-provider` is used by the API to determine how to decode the token */
          'auth-provider': type,
          authorization: `Bearer ${authToken}`,
          ...graphQLClientConfig.headers,
        },
      }}
    >
      {children}
    </GraphQLProvider>
  )
}

interface RedwoodProviderProps
  extends Omit<ComponentProps<typeof GraphQLProvider>, 'config'> {
  useAuth?(): AuthContextInterface
  graphQLClientConfig?: ComponentProps<typeof GraphQLProvider>['config']
}

/**
 * Redwood's Provider is a zeroconf way to tie together authentication and
 * GraphQL requests.
 *
 * When `AuthProvider` is instantiated this component will automatically add
 * Authorization headers to each request.
 */
const RedwoodProvider: React.FC<RedwoodProviderProps> = ({
  useAuth = window.__REDWOOD__USE_AUTH,
  graphQLClientConfig,
  children,
  ...rest
}) => {
  if (typeof useAuth === 'undefined') {
    return (
      <GraphQLProvider config={graphQLClientConfig} {...rest}>
        <FlashProvider>{children}</FlashProvider>
      </GraphQLProvider>
    )
  }

  return (
    <GraphQLProviderWithAuth
      useAuth={useAuth}
      graphQLClientConfig={graphQLClientConfig}
      {...rest}
    >
      <FlashProvider>{children}</FlashProvider>
    </GraphQLProviderWithAuth>
  )
}

export default RedwoodProvider
