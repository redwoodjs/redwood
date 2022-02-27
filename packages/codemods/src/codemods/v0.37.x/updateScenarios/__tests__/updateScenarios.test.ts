describe('Update Scenarios', () => {
  it('Modifies simple Scenarios', async () => {
    await matchTransformSnapshot('updateScenarios', 'simple')
  })

  it('Modifies more complex Scenarios', async () => {
    await matchTransformSnapshot('updateScenarios', 'realExample')
  })
})
