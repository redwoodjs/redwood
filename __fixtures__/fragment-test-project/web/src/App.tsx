import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import introspection from 'src/graphql/possibleTypes'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <RedwoodApolloProvider
        graphQLClientConfig={{
          cacheConfig: {
            possibleTypes: introspection.possibleTypes,
          },
        }}
      >
        <Routes />
      </RedwoodApolloProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
