import type {
  ApolloClientOptions,
  setLogVerbosity,
  ApolloCache,
} from '@apollo/client'
import * as apolloClient from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { getMainDefinition } from '@apollo/client/utilities'
import { fetch as crossFetch } from '@whatwg-node/fetch'
import { print } from 'graphql/language/printer'

// Note: Importing directly from `apollo/client` doesn't work properly in Storybook.
const {
  ApolloProvider,
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  useQuery,
  useMutation,
  useSubscription,
  useBackgroundQuery,
  useReadQuery,
  useSuspenseQuery,
  setLogVerbosity: apolloSetLogVerbosity,
} = apolloClient

import { UseAuth, useNoAuth } from '@redwoodjs/auth'
import './typeOverride'

import {
  FetchConfigProvider,
  useFetchConfig,
} from '../components/FetchConfigProvider'
import { GraphQLHooksProvider } from '../components/GraphQLHooksProvider'

import { SSELink } from './sseLink'

export type ApolloClientCacheConfig = apolloClient.InMemoryCacheConfig

export type RedwoodApolloLinkName =
  | 'withToken'
  | 'authMiddleware'
  | 'updateDataApolloLink'
  | 'terminatingLink'

export type RedwoodApolloLink<
  Name extends RedwoodApolloLinkName,
  Link extends apolloClient.ApolloLink = apolloClient.ApolloLink
> = {
  name: Name
  link: Link
}

export type RedwoodApolloLinks = [
  RedwoodApolloLink<'withToken'>,
  RedwoodApolloLink<'authMiddleware'>,
  RedwoodApolloLink<'updateDataApolloLink'>,
  RedwoodApolloLink<
    'terminatingLink',
    apolloClient.ApolloLink | apolloClient.HttpLink
  >
]

export type RedwoodApolloLinkFactory = (
  links: RedwoodApolloLinks
) => apolloClient.ApolloLink

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
  httpLinkConfig?: apolloClient.HttpOptions
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
  link?: apolloClient.ApolloLink | RedwoodApolloLinkFactory
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

  // Here we're using Apollo Link to customize Apollo Client's data flow.
  // Although we're sending conventional HTTP-based requests and could just pass `uri` instead of `link`,
  // we need to fetch a new token on every request, making middleware a good fit for this.
  //
  // See https://www.apollographql.com/docs/react/api/link/introduction.
  const { getToken, type: authProviderType } = useAuth()

  // `updateDataApolloLink` keeps track of the most recent req/res data so they can be passed to
  // any errors passed up to an error boundary.
  const data = {
    mostRecentRequest: undefined,
    mostRecentResponse: undefined,
  } as any

  const updateDataApolloLink = new ApolloLink((operation, forward) => {
    const { operationName, query, variables } = operation

    data.mostRecentRequest = {}
    data.mostRecentRequest.operationName = operationName
    data.mostRecentRequest.operationKind = query?.kind.toString()
    data.mostRecentRequest.variables = variables
    data.mostRecentRequest.query = query && print(operation.query)

    return forward(operation).map((result) => {
      data.mostRecentResponse = result

      return result
    })
  })

  const withToken = setContext(async () => {
    const token = await getToken()

    return { token }
  })

  const { headers, uri } = useFetchConfig()

  const authMiddleware = new ApolloLink((operation, forward) => {
    const { token } = operation.getContext()

    // Only add auth headers when there's a token. `token` is `null` when `!isAuthenticated`.
    const authHeaders = token
      ? {
          'auth-provider': authProviderType,
          authorization: `Bearer ${token}`,
        }
      : {}

    operation.setContext(() => ({
      headers: {
        ...operation.getContext().headers,
        ...headers,
        // Duped auth headers, because we may remove the `FetchConfigProvider` at a later date.
        ...authHeaders,
      },
    }))

    return forward(operation)
  })

  const { httpLinkConfig, link: redwoodApolloLink, ...rest } = config ?? {}

  // A terminating link. Apollo Client uses this to send GraphQL operations to a server over HTTP.
  // See https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link.
  let httpLink = new HttpLink({ uri, ...httpLinkConfig })
  if (globalThis.RWJS_EXP_STREAMING_SSR) {
    httpLink = new HttpLink({ uri, fetch: crossFetch, ...httpLinkConfig })
  }

  // Our terminating link needs to be smart enough to handle subscriptions, and if the GraphQL query
  // is subscription it needs to use the SSELink (server sent events link).
  const terminatingLink = apolloClient.split(
    ({ query }) => {
      const definition = getMainDefinition(query)

      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      )
    },
    new SSELink({
      url: uri,
      auth: { authProviderType, tokenFn: getToken },
      httpLinkConfig,
      headers,
    }),
    httpLink
  )

  // The order here is important. The last link *must* be a terminating link like HttpLink or SSELink.
  const redwoodApolloLinks: RedwoodApolloLinks = [
    { name: 'withToken', link: withToken },
    { name: 'authMiddleware', link: authMiddleware },
    { name: 'updateDataApolloLink', link: updateDataApolloLink },
    { name: 'terminatingLink', link: terminatingLink },
  ]

  let link = redwoodApolloLink

  link ??= ApolloLink.from(redwoodApolloLinks.map((l) => l.link))

  if (typeof link === 'function') {
    link = link(redwoodApolloLinks)
  }

  const client = new ApolloClient({
    // Default options for every Cell. Better to specify them here than in `beforeQuery` where it's too easy to overwrite them.
    // See https://www.apollographql.com/docs/react/api/core/ApolloClient/#example-defaultoptions-object.
    defaultOptions: {
      watchQuery: {
        // The `fetchPolicy` we expect:
        //
        // > Apollo Client executes the full query against both the cache and your GraphQL server.
        // > The query automatically updates if the result of the server-side query modifies cached fields.
        //
        // See https://www.apollographql.com/docs/react/data/queries/#cache-and-network.
        fetchPolicy: 'cache-and-network',
        // So that Cells rerender when refetching.
        // See https://www.apollographql.com/docs/react/data/queries/#inspecting-loading-states.
        notifyOnNetworkStatusChange: true,
      },
    },
    link,
    ...rest,
  })

  const extendErrorAndRethrow = (error: any, _errorInfo: React.ErrorInfo) => {
    error['mostRecentRequest'] = data.mostRecentRequest
    error['mostRecentResponse'] = data.mostRecentResponse
    throw error
  }

  return (
    <ApolloProvider client={client}>
      <ErrorBoundary onError={extendErrorAndRethrow}>{children}</ErrorBoundary>
    </ApolloProvider>
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

  const cache = new InMemoryCache(cacheConfig).restore(
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
          useBackgroundQuery={useBackgroundQuery}
          useReadQuery={useReadQuery}
          useSuspenseQuery={useSuspenseQuery}
        >
          {children}
        </GraphQLHooksProvider>
      </ApolloProviderWithFetchConfig>
    </FetchConfigProvider>
  )
}
