import React from 'react'

// import { VirtualClientRouter } from '@redwoodjs/router/dist/virtual-client-router'
import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import { ClientRouter } from './ClientRouter'
import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'

import './index.css'
import './scaffold.css'

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        <RedwoodApolloProvider>
          <ClientRouter />
        </RedwoodApolloProvider>
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}

export default App
