import { useState, useEffect } from 'react'

import type { AuthContextInterface } from '@redwoodjs/auth'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { FlashProvider } from '../flash'

import { GraphQLProvider } from '../graphql'

type RedwoodProviderProps = {
  useAuth: () => AuthContextInterface
  children: React.ReactNode | React.ReactNode[] | null
}

const GraphQLProviderWithAuth: React.FC<RedwoodProviderProps> = ({
  useAuth,
  children,
}) => {
  const { loading, isAuthenticated, getToken, type } = useAuth()
  const [authToken, setAuthToken] = useState<string | null>()

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
      <GraphQLProvider>
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
      headers={{
        /** `auth-provider` is used by the API to determine how to decode the token */
        'auth-provider': type,
        authorization: `Bearer ${authToken}`,
      }}
    >
      {children}
    </GraphQLProvider>
  )
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
  children,
  ...rest
}) => {
  if (typeof useAuth === 'undefined') {
    return (
      <GraphQLProvider>
        <FlashProvider>{children}</FlashProvider>
      </GraphQLProvider>
    )
  }

  return (
    <GraphQLProviderWithAuth
      useAuth={useAuth}
      {...rest}
    >
      <FlashProvider>{children}</FlashProvider>
    </GraphQLProviderWithAuth>
  )
}

export default RedwoodProvider
