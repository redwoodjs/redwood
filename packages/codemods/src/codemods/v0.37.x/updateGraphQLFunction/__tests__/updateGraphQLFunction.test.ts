// ts and js are equivalent in this case
test('Graphql function changes', () => {
  matchTransformSnapshot('updateGraphQLFunction', 'graphql')
})

test('Inline import test', () => {
  matchInlineTransformSnapshot(
    'updateGraphQLFunction',
    `import {
    createGraphQLHandler,
    makeMergedSchema,
    makeServices,
  } from '@redwoodjs/api'`,
    `import { createGraphQLHandler } from '@redwoodjs/graphql-server'`
  )
})
