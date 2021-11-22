import transform from '../removeBabelConfig'
test('Checking testing mechanism', async () => {
  await matchFolderTransform(transform, 'defaultConfig')
})
