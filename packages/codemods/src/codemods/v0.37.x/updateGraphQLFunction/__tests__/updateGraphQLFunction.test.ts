/**
 * ts and js are equivalent in this case
 */
describe('Update GraphQL Function', () => {
  it('Modifies imports and createGraphQLHandler', () => {
    matchTransformSnapshot('updateGraphQLFunction', 'graphql')
  })

  it('Modifies imports (inline)', () => {
    matchInlineTransformSnapshot(
      'updateGraphQLFunction',
      `import {
        createGraphQLHandler,
        makeMergedSchema,
      } from '@redwoodjs/api'`,
      `import { createGraphQLHandler } from '@redwoodjs/graphql-server'`
    )
  })
})
