import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'
import Routes from './Routes'

import './index.css'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodApolloProvider>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <Routes />
      </RedwoodProvider>
    </RedwoodApolloProvider>
  </FatalErrorBoundary>
)

export default App
