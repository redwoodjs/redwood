import { FetchConfigProvider, useFetchConfig } from './FetchConfigProvider'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { FlashProvider } from '../flash'
import { GraphQLProvider, GraphQLClientConfig } from '../graphql'

const GraphQLProviderWithFetchConfig: React.FunctionComponent<{
  config?: GraphQLClientConfig
  children: React.ReactNode
}> = ({ config = {}, children, ...rest }) => {
  const authConfig = useFetchConfig()

  return (
    <GraphQLProvider
      config={
        {
          ...authConfig,
          ...config,
        } as GraphQLClientConfig
      }
      {...rest}
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
const RedwoodProvider: React.FunctionComponent<{
  graphQLClientConfig?: GraphQLClientConfig
}> = ({ graphQLClientConfig, children }) => {
  return (
    <FetchConfigProvider>
      <GraphQLProviderWithFetchConfig config={graphQLClientConfig}>
        <FlashProvider>{children}</FlashProvider>
      </GraphQLProviderWithFetchConfig>
    </FetchConfigProvider>
  )
}

export default RedwoodProvider
