// ts and js are equivalent in this case
test('Graphql function changes', () => {
  matchTransformSnapshot('updateGraphQLFunction', 'graphql')
})
