describe('updateResolverTypes', () => {
  it('Converts PostResolvers to Partial<PostResolvers>', async () => {
    await matchTransformSnapshot('updateResolverTypes', 'default')
  })
})
