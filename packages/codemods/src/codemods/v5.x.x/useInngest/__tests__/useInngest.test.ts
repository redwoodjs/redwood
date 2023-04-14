describe('useInngest', () => {
  describe('given a standard default GraphQL handler', () => {
    it('configures the useInngest plugin', async () => {
      await matchTransformSnapshot('useInngest', 'default')
    })
  })

  describe('when GraphQL handler already configures some extraPlugins', () => {
    it('adds to extraPlugins', async () => {
      await matchTransformSnapshot('useInngest', 'extraPlugins')
    })
  })

  describe('when GraphQL handler already has useInngest setup', () => {
    it('makes no changes', async () => {
      await matchTransformSnapshot('useInngest', 'exists')
    })
  })
})
