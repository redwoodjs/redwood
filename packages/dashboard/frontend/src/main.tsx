import React from 'react'

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'

import './index.css'

import MasterLayout from './Layouts/MasterLayout'
import GraphiQL from './Pages/GraphiQL'
import Landing from './Pages/Landing'
import NotFound from './Pages/NotFound'
import Trace from './Pages/Trace'
import Tracing from './Pages/Tracing'

const client = new ApolloClient({
  uri: 'http://localhost:4318/graphql',
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <HashRouter>
        <Routes>
          <Route element={<MasterLayout />}>
            <Route index element={<Landing />} />
            <Route path="/tracing" element={<Tracing />} />
            <Route path="/tracing/:traceId" element={<Trace />} />
            <Route path="/graphiql" element={<GraphiQL />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ApolloProvider>
  </React.StrictMode>
)
