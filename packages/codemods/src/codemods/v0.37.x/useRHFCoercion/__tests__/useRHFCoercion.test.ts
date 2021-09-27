describe('React hook forms: Coercion', () => {
  test('Transforms javascript', () => {
    matchTransformSnapshot('useRHFCoercion', 'javascript')
  })

  test('Transforms typescript', () => {
    throw new Error('Implement me')
  })
})
