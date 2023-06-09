import fg from 'fast-glob'

describe('convertJsToJsx', () => {
  it('Converts an example project correctly', async () => {
    await matchFolderTransformRunCodemod('convertJsToJsx', 'example', {
      targetPathsGenerator: (cwd: string) =>
        fg.sync('web/src/**/*.js', {
          cwd,
        }),
    })
  })

  it('Converts a js file containing jsx', async () => {
    await matchFolderTransformRunCodemod('convertJsToJsx', 'withJSX')
  })

  it('Ignores a js file not containing jsx', async () => {
    await matchFolderTransformRunCodemod('convertJsToJsx', 'withoutJSX')
  })
})
