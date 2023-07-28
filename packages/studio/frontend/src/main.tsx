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
import SpanTreeMap from './Pages/Explore/SpanTreeMap'
import Trace from './Pages/Explore/Trace'
import TraceList from './Pages/Explore/TraceList'
import GraphiQL from './Pages/GraphiQL'
import MailPreview from './Pages/Mail/Preview'
import MailSink from './Pages/Mail/Sink'
import MapLanding from './Pages/MapLanding'
import NotFound from './Pages/NotFound'
import Overview from './Pages/Overview'
import Performance from './Pages/Performance'

const client = new ApolloClient({
  uri: 'http://localhost:4318/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Span: {
        keyFields: ['id', 'type'],
      },
    },
  }),
  connectToDevTools: true,
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <HashRouter>
        <Routes>
          <Route element={<MasterLayout />}>
            <Route index element={<Overview />} />

            {/* Explore */}
            <Route path="/explorer">
              {/* OpenTelemetry tracing */}
              <Route path="trace" element={<TraceList />} />
              <Route path="trace/:traceId" element={<Trace />} />
              <Route path="span" element={<SpanList />} />
              <Route path="span/:spanId" element={<Span />} />
              <Route path="map" element={<MapLanding />} />
              <Route path="map/:spanId" element={<SpanTreeMap />} />
            </Route>

            {/* Monitor */}
            <Route path="/monitor">
              <Route path="performance" element={<Performance />} />
              <Route path="error">
                <Route index element={<ComingSoon />} />
                <Route path=":spanId" element={<ComingSoon />} />
                <Route path=":spanId/:errorTime" element={<ComingSoon />} />
              </Route>
            </Route>

            {/* GraphiQL */}
            <Route path="/graphiql" element={<GraphiQL />} />

            {/* Mail */}
            <Route path="/mail">
              <Route path="sink" element={<MailSink />} />
              <Route path="preview" element={<MailPreview />} />
            </Route>

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
