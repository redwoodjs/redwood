import type {
  mockGraphQLQuery as _mockGraphQLQuery,
  mockGraphQLMutation as _mockGraphQLMutation,
  mockCurrentUser as _mockCurrentUser,
} from './mockRequests'

declare global {
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  const mockGraphQLMutation: typeof _mockGraphQLMutation
  const mockCurrentUser: typeof _mockCurrentUser
  // eslint-disable-next-line
  var mockedCurrentUser: null | Record<string, unknown>
  const scenario: (name: string, fn: () => void) => void
}
