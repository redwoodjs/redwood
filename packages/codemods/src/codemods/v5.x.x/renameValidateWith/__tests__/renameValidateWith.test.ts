describe('renameValidateWith', () => {
  it('Renames `validateWith` to `validateWithSync`', async () => {
    await matchTransformSnapshot('renameValidateWith', 'default')
  })
})
