describe('changeSrcImports', () => {
  it('Converts world to bazinga', async () => {
    await matchTransformSnapshot('changeSrcImports', 'default')
  })
})
