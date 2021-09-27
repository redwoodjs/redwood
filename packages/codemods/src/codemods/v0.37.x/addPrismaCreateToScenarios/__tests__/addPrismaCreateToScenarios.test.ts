describe('Add prisma create scenario', () => {
  it('Modified simple scenarios', () => {
    matchTransformSnapshot('addPrismaCreateToScenarios', 'simple')
  })

  it('Modifies more complex scenarios', () => {
    matchTransformSnapshot('addPrismaCreateToScenarios', 'realExample')
  })
})
