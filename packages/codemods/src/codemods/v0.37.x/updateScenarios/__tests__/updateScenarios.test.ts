describe('Update Scenarios', () => {
  it('Modifies simple Scenarios', () => {
    matchTransformSnapshot('updateScenarios', 'simple')
  })

  it('Modifies more complex Scenarios', () => {
    matchTransformSnapshot('updateScenarios', 'realExample')
  })
})
