describe('replaceComponentSvgs', () => {
  it('Handles simple Svgs as components', async () => {
    await matchTransformSnapshot('replaceComponentSvgs', 'default')
  })

  it('Carries over other attrs', async () => {
    await matchTransformSnapshot('replaceComponentSvgs', 'otherAttrs')
  })
})
