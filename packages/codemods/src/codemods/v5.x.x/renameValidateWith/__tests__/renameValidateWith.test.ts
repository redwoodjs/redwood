describe('renameValidateWith', () => {
  it('Converts validateWith to validateWithSync', async () => {
    await matchTransformSnapshot('renameValidateWith', 'default')
  })
})
