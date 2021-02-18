import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'
import { FatalErrorBoundary } from '@redwoodjs/web'

import Routes from 'src/Routes'
import FatalErrorPage from 'src/pages/FatalErrorPage'

import './index.css'

export default () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodApolloProvider>
      <Routes />
    </RedwoodApolloProvider>
  </FatalErrorBoundary>
)
