import React from 'react'

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'

import './index.css'

import MasterLayout from './Layouts/MasterLayout'
import ComingSoon from './Pages/ComingSoon'
import Config from './Pages/Config'
import GraphiQL from './Pages/GraphiQL'
import Landing from './Pages/Landing'
import NotFound from './Pages/NotFound'
import SQL from './Pages/SQL'
import Trace from './Pages/Tracing/Trace'
import Tracing from './Pages/Tracing/Tracing'

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

            {/* Tracing */}
            <Route path="/tracing" element={<Tracing />} />
            <Route path="/tracing/:traceId" element={<Trace />} />

            {/* GraphiQL */}
            <Route path="/graphiql" element={<GraphiQL />} />

            {/* SQL */}
            <Route path="/sql" element={<SQL />} />

            {/* Config */}
            <Route path="/config" element={<Config />} />

            {/* Coming Soon */}
            <Route path="/coming-soon" element={<ComingSoon />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </ApolloProvider>
  </React.StrictMode>
)
