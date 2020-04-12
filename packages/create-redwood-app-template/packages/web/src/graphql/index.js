import ApolloClient from 'apollo-boost'
import { ApolloProvider } from '@apollo/react-hooks'

import { __REDWOOD__ } from 'src/config'
export { withCell } from './withCell'

const DEFAULT_CLIENT_CONFIG = {
  uri: `${__REDWOOD__.API_PROXY_PATH}/graphql`,
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
