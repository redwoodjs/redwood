describe('Update Forms', () => {
  test('Transforms javascript', () => {
    matchTransformSnapshot('updateForms', 'javascript')
  })

  test('Transforms typescript', () => {
    matchTransformSnapshot('updateForms', 'typescript')
  })
})
