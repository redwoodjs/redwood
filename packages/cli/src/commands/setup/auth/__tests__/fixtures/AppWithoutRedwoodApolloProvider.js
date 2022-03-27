import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import './index.css'

const queryClient = {}

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <QueryClientProvider client={queryClient}>
        <RedwoodReactQueryProvider>
          <Routes />
        </RedwoodReactQueryProvider>
      </QueryClientProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
