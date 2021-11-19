import type { ApolloClientOptions, setLogVerbosity } from '@apollo/client'
import * as apolloClient from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import type { F } from 'ts-toolbelt'
// Note: Importing directly from `apollo/client` does not work properly in Storybook.
const {
  ApolloProvider,
  ApolloClient,
  ApolloLink,
  createHttpLink,
  InMemoryCache,
  useQuery,
  useMutation,
  setLogVerbosity: apolloSetLogVerbosity,
} = apolloClient

import type { AuthContextInterface } from '@redwoodjs/auth'
import { useAuth as useRWAuth } from '@redwoodjs/auth'
import './typeOverride'

import {
  FetchConfigProvider,
  useFetchConfig,
} from '../components/FetchConfigProvider'
import { GraphQLHooksProvider } from '../components/GraphQLHooksProvider'

export type ApolloClientCacheConfig = apolloClient.InMemoryCacheConfig

export type UseAuthProp = () => AuthContextInterface

const ApolloProviderWithFetchConfig: React.FunctionComponent<{
  config: ApolloClientOptions<unknown>
  useAuth: UseAuthProp
  logLevel: F.Return<typeof setLogVerbosity>
}> = ({ config, children, useAuth, logLevel }) => {
  /**
   * Should they run into it,
   * this helps users with the "Cannot render cell; GraphQL success but data is null" error.
   *
   * @see {@link https://github.com/redwoodjs/redwood/issues/2473}
   */
  apolloSetLogVerbosity(logLevel)

  const { uri, headers } = useFetchConfig()
  const { getToken, type: authProviderType, isAuthenticated } = useAuth()

  const withToken = setContext(async () => {
    if (isAuthenticated && getToken) {
      const token = await getToken()

      return { token }
    }

    return { token: null }
  })

  const authMiddleware = new ApolloLink((operation, forward) => {
    const { token } = operation.getContext()

    // Only add auth headers when token is present
    // Token is null, when !isAuthenticated
    const authHeaders = token
      ? {
          'auth-provider': authProviderType,
          authorization: `Bearer ${token}`,
        }
      : {}

    operation.setContext(() => ({
      headers: {
        ...headers,
        // Duped auth headers, because we may remove FetchContext at a later date
        ...authHeaders,
      },
    }))
    return forward(operation)
  })

  const httpLink = createHttpLink({ uri })

  const client = new ApolloClient({
    ...config,
    /**
     * Default options for every Cell.
     * Better to specify them here than in `beforeQuery`
     * where it's too easy to overwrite them.
     *
     * @see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient/#example-defaultoptions-object}
     */
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
      },
    },
    link: ApolloLink.from([withToken, authMiddleware.concat(httpLink)]),
  })

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export type GraphQLClientConfigProp = ApolloClientOptions<unknown> & {
  cacheConfig?: ApolloClientCacheConfig
}

export const RedwoodApolloProvider: React.FunctionComponent<{
  graphQLClientConfig?: GraphQLClientConfigProp
  useAuth?: UseAuthProp
  logLevel?: F.Return<typeof setLogVerbosity>
}> = ({
  graphQLClientConfig,
  useAuth = useRWAuth,
  logLevel = 'debug',
  children,
}) => {
  /**
   * Since Apollo Client gets re-instantiated on auth changes,
   * we have to instantiate `InMemoryCache` here,
   * so that it doesn't get wiped.
   */
  const { cacheConfig, ...config } = graphQLClientConfig ?? {}

  const cache = new InMemoryCache(cacheConfig)

  return (
    <FetchConfigProvider useAuth={useAuth}>
      <ApolloProviderWithFetchConfig
        /**
         * This order so that the user can still completely ovwrite the cache.
         */
        config={{ cache, ...config }}
        useAuth={useAuth}
        logLevel={logLevel}
      >
        <GraphQLHooksProvider useQuery={useQuery} useMutation={useMutation}>
          {children}
        </GraphQLHooksProvider>
      </ApolloProviderWithFetchConfig>
    </FetchConfigProvider>
  )
}
