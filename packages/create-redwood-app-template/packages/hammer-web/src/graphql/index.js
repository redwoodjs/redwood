import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

export { useCell, WithCell } from './cell'

const DEFAULT_CLIENT_CONFIG = {
  uri: `${__HAMMER__.apiProxyPath}/graphql`,
}

export const createGraphQLClient = (config) => {
  return new ApolloClient({ ...DEFAULT_CLIENT_CONFIG, ...config })
}

export const GraphQLProvider = ({
  client = createGraphQLClient(),
  ...rest
}) => {
  return <ApolloProvider client={client} {...rest} />
}
