/* eslint-disable no-undef */
/*eslint no-redeclare: [2, { "builtinGlobals": false }]*/
import {
  mockGraphQLMutation as _mockGraphQLMutation,
  mockGraphQLQuery as _mockGraphQLQuery,
  startMSW as _startMSW,
  setupRequestHandlers as _setupRequestHandlers,
} from './mockRequests'
import { MockProviders as _MockProviders } from './MockProviders'
declare module '@redwoodjs/testing' {
  const mockGraphQLMutation: typeof _mockGraphQLMutation
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  const MockProviders: typeof _MockProviders
  const startMSW: typeof _startMSW
  const setupRequestHandlers: typeof _setupRequestHandlers
}
