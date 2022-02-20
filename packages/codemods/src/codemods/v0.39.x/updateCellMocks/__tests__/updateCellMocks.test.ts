describe('Update cell mocks', () => {
  test('Converts object mock to a function that returns the object', async () => {
    await matchTransformSnapshot('updateCellMocks', 'objectCellMock')
  })

  test('Handles Types', async () => {
    await matchTransformSnapshot('updateCellMocks', 'objectCellMockWithType')
  })

  test('Ignores mocks that are already functions', async () => {
    await matchTransformSnapshot('updateCellMocks', 'alreadyFunction')
  })
})
