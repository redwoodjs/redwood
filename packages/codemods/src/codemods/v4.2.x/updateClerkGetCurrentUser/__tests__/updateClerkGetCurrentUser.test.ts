describe('clerk', () => {
  it('updates the getCurrentUser function', async () => {
    await matchTransformSnapshot('updateClerkGetCurrentUser', 'default')
  })
})
