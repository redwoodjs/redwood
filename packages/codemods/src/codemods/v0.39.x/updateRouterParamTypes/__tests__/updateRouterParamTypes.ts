describe('Update Router paramTypes', () => {
  test('Transforms variable referenced paramTypes', () => {
    matchTransformSnapshot('updateRouterParamTypes', 'variableRef')
  })

  test('Transforms embedded object paramTypes', () => {
    matchTransformSnapshot('updateRouterParamTypes', 'embedded')
  })

  test('Transforms embedded object paramTypes', () => {
    matchTransformSnapshot('updateRouterParamTypes', 'partialEmbeds')
  })
})
