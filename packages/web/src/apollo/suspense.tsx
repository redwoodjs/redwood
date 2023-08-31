/***
 *
 * This is a lift and shift of the original ApolloProvider
 * but with suspense specific bits. Look for @MARK to find bits I've changed
 *
 * Done this way, to avoid making changes breaking on main, due to the experimental-nextjs import
 * Eventually we will have one ApolloProvider, not multiple.
 */

import type {
  ApolloCache,
  ApolloClientOptions,
  HttpOptions,
  InMemoryCacheConfig,
  setLogVerbosity,
} from '@apollo/client'
import {
  ApolloLink,
  setLogVerbosity as apolloSetLogVerbosity,
  useMutation,
  useSubscription,
} from '@apollo/client'
import {
  ApolloNextAppProvider,
  NextSSRApolloClient,
  NextSSRInMemoryCache,
  useSuspenseQuery,
  useBackgroundQuery,
  useReadQuery,
  useQuery,
} from '@apollo/experimental-nextjs-app-support/ssr'

import { UseAuth, useNoAuth } from '@redwoodjs/auth'
import './typeOverride'

import {
  FetchConfigProvider,
  useFetchConfig,
} from '../components/FetchConfigProvider'
import { GraphQLHooksProvider } from '../components/GraphQLHooksProvider'

import type {
  RedwoodApolloLink,
  RedwoodApolloLinkFactory,
  RedwoodApolloLinkName,
  RedwoodApolloLinks,
} from './links'
import {
  createAuthApolloLink,
  createFinalLink,
  createHttpLink,
  createTokenLink,
  createUpdateDataLink,
} from './links'

export type ApolloClientCacheConfig = InMemoryCacheConfig

export type {
  RedwoodApolloLink,
  RedwoodApolloLinkFactory,
  RedwoodApolloLinkName,
  RedwoodApolloLinks,
}

export type GraphQLClientConfigProp = Omit<
  ApolloClientOptions<unknown>,
  'cache' | 'link'
> & {
  cache?: ApolloCache<unknown>
  /**
   * Configuration for Apollo Client's `InMemoryCache`.
   * See https://www.apollographql.com/docs/react/caching/cache-configuration/.
   */
  cacheConfig?: ApolloClientCacheConfig
  /**
   * Configuration for the terminating `HttpLink`.
   * See https://www.apollographql.com/docs/react/api/link/apollo-link-http/#httplink-constructor-options.
   *
   * For example, you can use this prop to set the credentials policy so that cookies can be sent to other domains:
   *
   * ```js
   * <RedwoodApolloProvider graphQLClientConfig={{
   *   httpLinkConfig: { credentials: 'include' }
   * }}>
   * ```
   */
  httpLinkConfig?: HttpOptions
  /**
   * Extend or overwrite `RedwoodApolloProvider`'s Apollo Link.
   *
   * To overwrite Redwood's Apollo Link, just provide your own `ApolloLink`.
   *
   * To extend Redwood's Apollo Link, provide a function—it'll get passed an array of Redwood's Apollo Links
   * which are objects with a name and link property:
   *
   * ```js
   * const link = (redwoodApolloLinks) => {
   *   const consoleLink = new ApolloLink((operation, forward) => {
   *     console.log(operation.operationName)
   *     return forward(operation)
   *   })
   *
   *   return ApolloLink.from([consoleLink, ...redwoodApolloLinks.map(({ link }) => link)])
   * }
   * ```
   *
   * If you do this, there's a few things you should keep in mind:
   * - your function should return a single link (e.g., using `ApolloLink.from`; see https://www.apollographql.com/docs/react/api/link/introduction/#additive-composition)
   * - the `HttpLink` should come last (https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link)
   */
  link?: ApolloLink | RedwoodApolloLinkFactory
}

const ApolloProviderWithFetchConfig: React.FunctionComponent<{
  config: Omit<GraphQLClientConfigProp, 'cacheConfig' | 'cache'> & {
    cache: ApolloCache<unknown>
  }
  useAuth?: UseAuth
  logLevel: ReturnType<typeof setLogVerbosity>
  children: React.ReactNode
}> = ({ config, children, useAuth = useNoAuth, logLevel }) => {
  // Should they run into it, this helps users with the "Cannot render cell; GraphQL success but data is null" error.
  // See https://github.com/redwoodjs/redwood/issues/2473.
  apolloSetLogVerbosity(logLevel)

  // See https://www.apollographql.com/docs/react/api/link/introduction.
  const { getToken, type: authProviderType } = useAuth()

  // `updateDataApolloLink` keeps track of the most recent req/res data so they can be passed to
  // any errors passed up to an error boundary.
  const data = {
    mostRecentRequest: undefined,
    mostRecentResponse: undefined,
  } as any

  const { headers, uri } = useFetchConfig()

  const getGraphqlUrl = () => {
    // @NOTE: This comes from packages/vite/src/streaming/registerGlobals.ts
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    // @TODO (STREAMING): Should this be a new config value in Redwood.toml?
    // How do we know what the absolute url is in production?
    // Possible solution: https://www.apollographql.com/docs/react/api/link/apollo-link-schema/

    return typeof window === 'undefined'
      ? RWJS_ENV.RWJS_EXP_SSR_GRAPHQL_ENDPOINT
      : uri
  }

  const { httpLinkConfig, link: userPassedLink, ...otherConfig } = config ?? {}

  // We use this object, because that's the shape of what we pass to the config.link factory
  const redwoodApolloLinks: RedwoodApolloLinks = [
    { name: 'withToken', link: createTokenLink(getToken) },
    {
      name: 'authMiddleware',
      link: createAuthApolloLink(authProviderType, headers),
    },
    // @TODO: do we need this in prod? I think it's only for dev errors
    { name: 'updateDataApolloLink', link: createUpdateDataLink(data) },
    { name: 'httpLink', link: createHttpLink(getGraphqlUrl(), httpLinkConfig) },
  ]

  const extendErrorAndRethrow = (error: any, _errorInfo: React.ErrorInfo) => {
    error['mostRecentRequest'] = data.mostRecentRequest
    error['mostRecentResponse'] = data.mostRecentResponse
    throw error
  }

  function makeClient() {
    // @MARK use special Apollo client
    return new NextSSRApolloClient({
      link: createFinalLink({
        userConfiguredLink: userPassedLink,
        defaultLinks: redwoodApolloLinks,
      }),
      ...otherConfig,
    })
  }

  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      <ErrorBoundary onError={extendErrorAndRethrow}>{children}</ErrorBoundary>
    </ApolloNextAppProvider>
  )
}

type ComponentDidCatch = React.ComponentLifecycle<any, any>['componentDidCatch']

interface ErrorBoundaryProps {
  error?: unknown
  onError: NonNullable<ComponentDidCatch>
  children: React.ReactNode
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(...args: Parameters<NonNullable<ComponentDidCatch>>) {
    this.setState({})
    this.props.onError(...args)
  }

  render() {
    return this.props.children
  }
}

export const RedwoodApolloProvider: React.FunctionComponent<{
  graphQLClientConfig?: GraphQLClientConfigProp
  useAuth?: UseAuth
  logLevel?: ReturnType<typeof setLogVerbosity>
  children: React.ReactNode
}> = ({
  graphQLClientConfig,
  useAuth = useNoAuth,
  logLevel = 'debug',
  children,
}) => {
  // Since Apollo Client gets re-instantiated on auth changes,
  // we have to instantiate `InMemoryCache` here, so that it doesn't get wiped.
  const { cacheConfig, ...config } = graphQLClientConfig ?? {}

  // @MARK we need this special cache
  const cache = new NextSSRInMemoryCache(cacheConfig).restore(
    globalThis?.__REDWOOD__APOLLO_STATE ?? {}
  )

  return (
    <FetchConfigProvider useAuth={useAuth}>
      <ApolloProviderWithFetchConfig
        // This order so that the user can still completely overwrite the cache.
        config={{ cache, ...config }}
        useAuth={useAuth}
        logLevel={logLevel}
      >
        <GraphQLHooksProvider
          useQuery={useQuery}
          useMutation={useMutation}
          useSubscription={useSubscription}
          useSuspenseQuery={useSuspenseQuery}
          useBackgroundQuery={useBackgroundQuery}
          useReadQuery={useReadQuery}
        >
          {children}
        </GraphQLHooksProvider>
      </ApolloProviderWithFetchConfig>
    </FetchConfigProvider>
  )
}
