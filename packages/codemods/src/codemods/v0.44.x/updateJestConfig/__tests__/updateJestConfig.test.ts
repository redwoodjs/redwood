import updateJestConfig from '../updateJestConfig'

describe('Update Jest Config', () => {
  it('Adds missing files', async () => {
    await matchFolderTransform(updateJestConfig, 'missing')
  })

  it('Updates the v0.43.0 template', async () => {
    await matchFolderTransform(updateJestConfig, 'default')
  })

  it('Keeps custom jest config in api and web', async () => {
    await matchFolderTransform(updateJestConfig, 'custom')
  })

  it('transforms', async () => {
    await matchTransformSnapshot('updateJestConfig.transform', 'default')
  })
})
