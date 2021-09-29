describe('React hook forms: Coercion', () => {
  test('Transforms javascript', () => {
    matchTransformSnapshot('updateForms', 'javascript')
  })

  test('Transforms typescript', () => {
    matchTransformSnapshot('updateForms', 'typescript')
  })
})
