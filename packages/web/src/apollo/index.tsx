import type {
  ApolloClientOptions,
  setLogVerbosity,
  ApolloCache,
} from '@apollo/client'
import * as apolloClient from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { print } from 'graphql/language/printer'

// Note: Importing directly from `apollo/client` does not work properly in Storybook.
const {
  ApolloProvider,
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
  useQuery,
  useMutation,
  setLogVerbosity: apolloSetLogVerbosity,
} = apolloClient

import { UseAuth, useNoAuth } from '@redwoodjs/auth'
import './typeOverride'

import {
  FetchConfigProvider,
  useFetchConfig,
} from '../components/FetchConfigProvider'
import { GraphQLHooksProvider } from '../components/GraphQLHooksProvider'

export type ApolloClientCacheConfig = apolloClient.InMemoryCacheConfig

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
   * To extend Redwood's Apollo Link, provide a function—it'll get passed an array of Redwood's Apollo Links:
   *
   * ```js
   * const link = (rwLinks) => {
   *   const consoleLink = new ApolloLink((operation, forward) => {
   *     console.log(operation.operationName)
   *     return forward(operation)
   *   })
   *
   *   return ApolloLink.from([consoleLink, ...rwLinks])
   * }
   * ```
   *
   * If you do this, there's several things you should keep in mind:
   * - your function should return a single link (e.g., using `ApolloLink.from`; see https://www.apollographql.com/docs/react/api/link/introduction/#additive-composition)
   * - the `HttpLink` should come last (https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link)
   */
  link?:
    | apolloClient.ApolloLink
    | ((
        rwLinks: [
          apolloClient.ApolloLink,
          apolloClient.ApolloLink,
          apolloClient.ApolloLink,
          apolloClient.HttpLink
        ]
      ) => apolloClient.ApolloLink)
}

const ApolloProviderWithFetchConfig: React.FunctionComponent<{
  config: Omit<GraphQLClientConfigProp, 'cacheConfig' | 'cache'> & {
    cache: ApolloCache<unknown>
  }
  useAuth?: UseAuth
  logLevel: ReturnType<typeof setLogVerbosity>
  children: React.ReactNode
}> = ({ config, children, useAuth = useNoAuth, logLevel }) => {
  /**
   * Should they run into it,
   * this helps users with the "Cannot render cell; GraphQL success but data is null" error.
   *
   * @see {@link https://github.com/redwoodjs/redwood/issues/2473}
   */
  apolloSetLogVerbosity(logLevel)

  /**
   * Here we're using Apollo Link to customize Apollo Client's data flow.
   *
   * Although we're sending conventional HTTP-based requests and could just pass `uri` instead of `link`,
   * we need to fetch a new token on every request, making middleware a good fit for this.
   *
   * @see {@link https://www.apollographql.com/docs/react/api/link/introduction/}
   */
  const { getToken, type: authProviderType } = useAuth()

  // updateDataApolloLink keeps track of the most recent req/res data so they can be passed into
  // any errors passed up to a error boundary.
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

  /**
   * A terminating link.
   * Apollo Client uses this to send GraphQL operations to a server over HTTP.
   *
   * @see {@link https://www.apollographql.com/docs/react/api/link/introduction/#the-terminating-link}
   */
  const { httpLinkConfig, link: userLink, ...rest } = config ?? {}

  const httpLink = new HttpLink({ uri, ...httpLinkConfig })

  /**
   * The order here is important. The last link *must* be a terminating link like HttpLink.
   */
  const rwLinks = [
    withToken,
    authMiddleware,
    updateDataApolloLink,
    httpLink,
  ] as [
    apolloClient.ApolloLink,
    apolloClient.ApolloLink,
    apolloClient.ApolloLink,
    apolloClient.HttpLink
  ]

  /**
   * If the user provides a link that's a function,
   * we want to call it with our link.
   *
   * If it's not, we just want to use it.
   *
   * And if they don't provide it, we just want to use ours.
   */
  let link = ApolloLink.from(rwLinks)

  if (userLink) {
    link = typeof userLink === 'function' ? userLink(rwLinks) : userLink
  }

  const client = new ApolloClient({
    /**
     * Default options for every Cell.
     * Better to specify them here than in `beforeQuery`
     * where it's too easy to overwrite them.
     *
     * @see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient/#example-defaultoptions-object}
     */
    defaultOptions: {
      watchQuery: {
        /**
         * The `fetchPolicy` we expect:
         *
         * > Apollo Client executes the full query against both the cache and your GraphQL server.
         * > The query automatically updates if the result of the server-side query modifies cached fields.
         *
         * @see {@link https://www.apollographql.com/docs/react/data/queries/#cache-and-network}
         */
        fetchPolicy: 'cache-and-network',
        /**
         * So that Cells rerender when refetching: {@link https://www.apollographql.com/docs/react/data/queries/#inspecting-loading-states}
         */
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
        // This order so that the user can still completely overwrite the cache
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
