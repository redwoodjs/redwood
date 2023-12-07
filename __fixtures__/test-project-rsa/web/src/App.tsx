import { FatalErrorBoundary } from '@redwoodjs/web'

import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'
import Routes from './Routes'

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <Routes />
  </FatalErrorBoundary>
)

export default App
