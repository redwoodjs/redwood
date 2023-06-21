describe('replaceComponentSvgs', () => {
  it('Handles simple Svgs as components', async () => {
    await matchFolderTransform('replaceComponentSvgs', 'simple', {
      useJsCodeshift: true,
      targetPathsGlob: '**/*.{js,jsx,tsx}',
    })
  })

  // it('Carries over other attrs', async () => {
  //   await matchTransformSnapshot('replaceComponentSvgs', 'otherAttrs')
  // })

  // it('Handles svgs used as render props', async () => {
  //   await matchTransformSnapshot('replaceComponentSvgs', 'renderProp')
  // })
})
