describe('replaceComponentSvgs', () => {
  it('Handles simple Svgs as components', async () => {
    await matchFolderTransform('replaceComponentSvgs', 'simple', {
      useJsCodeshift: true,
      targetPathsGlob: '**/*.{js,jsx,tsx}',
    })
  })

  it('Preserves attrs & deals with nesting', async () => {
    await matchFolderTransform('replaceComponentSvgs', 'complex', {
      useJsCodeshift: true,
      targetPathsGlob: '**/*.{js,jsx,tsx}',
    })
  })
})
