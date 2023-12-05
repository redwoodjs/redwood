import { createRoot } from 'react-dom/client'

import { FatalErrorBoundary } from '@redwoodjs/web'

import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'
import Routes from './Routes'

const redwoodAppElement = document.getElementById('redwood-app')

const root = createRoot(redwoodAppElement)

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <Routes />
    </FatalErrorBoundary>
  )
}

root.render(<App />)
