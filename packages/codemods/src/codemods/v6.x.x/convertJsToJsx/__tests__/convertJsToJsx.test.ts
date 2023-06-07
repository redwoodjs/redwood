import fg from 'fast-glob'

describe('convertJsToJsx', () => {
  it('Converts an example project correctly', async () => {
    await matchFolderTransformRunCodemod(
      'convertJsToJsx',
      (cwd: string) => {
        return fg.sync('web/src/**/*.js', { cwd })
      },
      'example'
    )
  })
})
