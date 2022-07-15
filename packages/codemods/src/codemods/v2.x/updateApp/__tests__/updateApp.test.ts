describe('Update App.{js,tsx}', () => {
  test('Update import and provider', async () => {
    await matchTransformSnapshot('updateApp', 'app')
  })
})
