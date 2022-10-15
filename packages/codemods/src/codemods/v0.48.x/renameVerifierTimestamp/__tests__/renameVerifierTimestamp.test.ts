describe('Rename verifier timestamp option', () => {
  it('Modifies simple Function', async () => {
    await matchTransformSnapshot('renameVerifierTimestamp', 'simple')
  })
})
