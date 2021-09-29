describe('Add prisma create scenario', () => {
  it('Modified simple scenarios', () => {
    matchTransformSnapshot('updateScenarios', 'simple')
  })

  it('Modifies more complex scenarios', () => {
    matchTransformSnapshot('updateScenarios', 'realExample')
  })
})
