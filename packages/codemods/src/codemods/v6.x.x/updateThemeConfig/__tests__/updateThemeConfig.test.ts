describe('updateThemeConfig', () => {
  it('Converts from module.exports to export default ', async () => {
    await matchTransformSnapshot('updateThemeConfig', 'default')
  })

  it('Handles when config is an identifier', async () => {
    await matchTransformSnapshot('updateThemeConfig', 'identifierTheme')
  })
})
