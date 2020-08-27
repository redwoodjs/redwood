import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client'

export { withCell } from './withCell'

/**
 * Creates a GraphQL Client (Apollo) that points to the `apiProxyPath` that's
 * specified in `redwood.toml`.
 */
export const createGraphQLClient = (config) => {
  return new ApolloClient({
    uri: `${window.__REDWOOD__API_PROXY_PATH}/graphql`,
    cache: new InMemoryCache(),
    ...config,
  })
}

/**
 * A GraphQL provider that instantiates a client automatically.
 */
export const GraphQLProvider = ({ config, ...rest }) => {
  return <ApolloProvider client={createGraphQLClient(config)} {...rest} />
}
