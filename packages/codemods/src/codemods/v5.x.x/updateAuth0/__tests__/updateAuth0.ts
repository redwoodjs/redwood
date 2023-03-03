describe('auth0', () => {
  it('updates the auth0 file', async () => {
    await matchTransformSnapshot('updateAuth0', 'default')
  })
})
