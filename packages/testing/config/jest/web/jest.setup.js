/* eslint-env jest */

require('@testing-library/jest-dom')
require('whatwg-fetch')

const {
  startMSW,
  setupRequestHandlers,
  mockGraphQLMutation,
  mockGraphQLQuery,
  mockCurrentUser,
} = require('@redwoodjs/testing/web')

global.mockGraphQLQuery = mockGraphQLQuery
global.mockGraphQLMutation = mockGraphQLMutation
global.mockCurrentUser = mockCurrentUser

beforeEach(async () => {
  await startMSW('node')
  setupRequestHandlers() // reset the handlers in each test.
})
