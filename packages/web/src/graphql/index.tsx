import {
  ApolloClient,
  ApolloClientOptions,
  InMemoryCache,
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { ApolloProviderProps } from '@apollo/client/react/context'

// @ts-expect-error - no defs
export { withCell } from './withCell'

type GraphQLClientConfig = Omit<
  ApolloClientOptions<InMemoryCache>,
  'uri' | 'cache'
>

/**
 * Create a GraphQL Client (Apollo) that points to the `apiProxyPath` that's
 * specified in `redwood.toml`.
 */
export const createGraphQLClient = (config: GraphQLClientConfig) => {
  return new ApolloClient({
    uri: `${window.__REDWOOD__API_PROXY_PATH}/graphql`,
    cache: new InMemoryCache(),
    ...config,
  })
}

/**
 * A GraphQL provider that instantiates a client automatically.
 */
export const GraphQLProvider = ({
  config,
  ...rest
}: {
  config: GraphQLClientConfig
} & Omit<ApolloProviderProps<any>, 'client'>) => {
  return <ApolloProvider client={createGraphQLClient(config)} {...rest} />
}
