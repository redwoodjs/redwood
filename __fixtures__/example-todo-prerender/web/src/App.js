import { AuthProvider } from '@redwoodjs/auth'
import { FatalErrorBoundary } from '@redwoodjs/web'
import { RedwoodApolloProvider as RedwoodProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <AuthProvider client={() => {}} type="netlify">
      <RedwoodProvider>
        <Routes />
      </RedwoodProvider>
    </AuthProvider>
  </FatalErrorBoundary>
)

export default App
