describe('changeSrcImports', () => {
  it('Converts all api src imports to api/src', async () => {
    await matchTransformSnapshot('changeSrcImports', 'default')
  })
})
