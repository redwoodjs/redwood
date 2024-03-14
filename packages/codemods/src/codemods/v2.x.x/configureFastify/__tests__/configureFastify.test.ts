describe('configureFastify', () => {
  it('Converts module.exports to { config }', async () => {
    await matchTransformSnapshot('configureFastify', 'default')
  })
})
