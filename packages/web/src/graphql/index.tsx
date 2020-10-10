import {
  ApolloClient,
  ApolloClientOptions,
  InMemoryCache,
} from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { ApolloProviderProps } from '@apollo/client/react/context'

export { withCell } from './withCell'

export type GraphQLClientConfig = Omit<
  ApolloClientOptions<InMemoryCache>,
  'uri' | 'cache'
>

export type GraphQLProviderProps = {
  config: GraphQLClientConfig
} & Omit<ApolloProviderProps<any>, 'client'> &
  Record<string, any>

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
export const GraphQLProvider: React.FC<GraphQLProviderProps> = ({
  config,
  ...rest
}) => {
  return <ApolloProvider client={createGraphQLClient(config)} {...rest} />
}
