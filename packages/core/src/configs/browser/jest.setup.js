require('@testing-library/jest-dom')
require('whatwg-fetch')

const { getProject } = require('@redwoodjs/structure')
const {
  startMSW,
  setupRequestHandlers,
  mockGraphQLMutation,
  mockGraphQLQuery,
} = require('@redwoodjs/testing')

globalThis.mockGraphQLQuery = mockGraphQLQuery
globalThis.mockGraphQLMutation = mockGraphQLMutation

beforeEach(async () => {
  // Import the global mocks.
  for (const m of getProject().mocks) {
    require(m)
  }
  await startMSW()
  setupRequestHandlers() // reset the handlers in each test.
})
