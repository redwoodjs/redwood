import React from 'react'

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import './index.css'

import MasterLayout from './Layouts/MasterLayout'
import ComingSoon from './Pages/ComingSoon'
import Config from './Pages/Config'
import Span from './Pages/Explore/Span'
import SpanList from './Pages/Explore/SpanList'
import Trace from './Pages/Explore/Trace'
import TraceList from './Pages/Explore/TraceList'
import TraceTree from './Pages/Explore/TraceTree'
import GraphiQL from './Pages/GraphiQL'
import Landing from './Pages/Landing'
import NotFound from './Pages/NotFound'

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

            {/* Explore */}
            <Route path="/explorer">
              {/* OpenTelemetry tracing */}
              <Route path="trace" element={<TraceList />} />
              <Route path="trace/:traceId" element={<Trace />} />
              <Route path="trace-tree/:traceId" element={<TraceTree />} />
              <Route path="span" element={<SpanList />} />
              <Route path="span/:spanId" element={<Span />} />
            </Route>

            {/* GraphiQL */}
            <Route path="/graphiql" element={<GraphiQL />} />

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
    <ToastContainer position="bottom-right" autoClose={5_000} />
  </React.StrictMode>
)
