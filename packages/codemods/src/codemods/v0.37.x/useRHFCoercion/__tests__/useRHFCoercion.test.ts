describe('React hook forms: Coercion', () => {
  test('Transforms javascript', () => {
    matchTransformSnapshot('useRHFCoercion', 'javascript')
  })

  test('Transforms typescript', () => {
    matchTransformSnapshot('useRHFCoercion', 'typescript')
  })
})
