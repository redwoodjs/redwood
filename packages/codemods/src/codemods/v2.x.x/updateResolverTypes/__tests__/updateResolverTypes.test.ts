describe('updateResolverTypes', () => {
  it('Converts PostResolvers to PostRelationResolvers>', async () => {
    await matchTransformSnapshot('updateResolverTypes', 'default')
  })
})
