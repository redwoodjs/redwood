import type {
  mockGraphQLQuery as _mockGraphQLQuery,
  mockGraphQLMutation as _mockGraphQLMutation,
} from './mockRequests'

declare global {
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  const mockGraphQLMutation: typeof _mockGraphQLMutation
  const scenario: (name: string, fn: () => void) => void
}
