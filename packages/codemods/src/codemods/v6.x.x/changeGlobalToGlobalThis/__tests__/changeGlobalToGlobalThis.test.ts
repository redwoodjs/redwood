describe('changeGlobalToGlobalThis', () => {
  it('Converts global to globalThis', async () => {
    await matchTransformSnapshot('changeGlobalToGlobalThis', 'default')
  })
})
