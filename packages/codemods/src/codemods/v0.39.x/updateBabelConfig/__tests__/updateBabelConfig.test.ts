import transform from '../updateBabelConfig'
test('Removes babel config for default setup', async () => {
  await matchFolderTransform(transform, 'default')
})

test('Should preserve custom web config', async () => {
  // Expecting:
  // a) .babelrc -> babel.config.js
  // b) removes "extends" property from config
  await matchFolderTransform(transform, 'webCustom')
})

test('Should throw if root babel.config.js has custom config', async () => {
  expect(async () =>
    matchFolderTransform(transform, 'rootCustom')
  ).rejects.toThrowError(
    'Cannot automatically codemod your project. Please move your root babel.config.js settings manually'
  )
})
