import transform from '../removeBabelConfig'
test('Should remove/rename configs correctly for the default setup', async () => {
  await matchFolderTransform(transform, 'defaultConfig')
})

test('Should preserve custom web config', async () => {
  await matchFolderTransform(transform, 'webCustom')
})
