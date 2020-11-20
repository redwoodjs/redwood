import {
  ApolloProvider,
  ApolloClientOptions,
  ApolloClient,
  InMemoryCache,
  useQuery,
} from '@apollo/client'

import {
  FetchConfigProvider,
  useFetchConfig,
} from 'src/components/FetchConfigProvider'
import { QueryHooksProvider } from 'src/components/QueryHooksProvider'
import { FlashProvider } from 'src/flash'

const ApolloProviderWithFetchConfig: React.FunctionComponent<{
  config?: Omit<ApolloClientOptions<InMemoryCache>, 'cache'>
}> = ({ config = {}, children }) => {
  const { uri, headers } = useFetchConfig()

  // TODO: Wrap in useMemo.
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri,
    headers,
    ...config,
  })

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

export const RedwoodApolloProvider: React.FunctionComponent<{
  graphQLClientConfig?: Omit<ApolloClientOptions<InMemoryCache>, 'cache'>
}> = ({ graphQLClientConfig, children }) => {
  return (
    <FetchConfigProvider>
      <ApolloProviderWithFetchConfig config={graphQLClientConfig}>
        <QueryHooksProvider registerUseQueryHook={useQuery}>
          <FlashProvider>{children}</FlashProvider>
        </QueryHooksProvider>
      </ApolloProviderWithFetchConfig>
    </FetchConfigProvider>
  )
}
