import type {
  mockGraphQLQuery as _mockGraphQLQuery,
  mockGraphQLMutation as _mockGraphQLMutation,
} from './mockRequests'

declare global {
  const mockGraphQLQuery: typeof _mockGraphQLQuery
  const mockGraphQLMutation: typeof _mockGraphQLMutation
  const testWithFixtures: (name: string, fn?: () => void) => void
  const itWithFixtures: (name: string, fn?: () => void) => void
}
