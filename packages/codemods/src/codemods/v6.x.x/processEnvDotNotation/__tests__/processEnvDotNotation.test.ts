describe('processEnvDotNotation', () => {
  it('Replaces array access syntax with dot notation', async () => {
    await matchTransformSnapshot('processEnvDotNotation', 'default')
  })
})
