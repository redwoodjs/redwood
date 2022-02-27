describe('Update API Imports', () => {
  it('Updates @redwoodjs/api imports', async () => {
    await matchTransformSnapshot('updateApiImports', 'apiImports')
  })
})
