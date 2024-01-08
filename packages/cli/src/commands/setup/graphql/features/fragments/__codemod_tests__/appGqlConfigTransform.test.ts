describe('fragments graphQLClientConfig', () => {
  test('Default App.tsx', async () => {
    await matchFolderTransform('appGqlConfigTransform', 'config-simple', {
      useJsCodeshift: true,
    })
  })

  test('App.tsx with existing inline graphQLClientConfig', async () => {
    await matchFolderTransform('appGqlConfigTransform', 'existingPropInline', {
      useJsCodeshift: true,
    })
  })

  test('App.tsx with existing graphQLClientConfig in separate variable', async () => {
    await matchFolderTransform(
      'appGqlConfigTransform',
      'existingPropVariable',
      {
        useJsCodeshift: true,
      }
    )
  })

  test('App.tsx with existing graphQLClientConfig in separate variable, without cacheConfig property', async () => {
    await matchFolderTransform(
      'appGqlConfigTransform',
      'existingPropVariableNoCacheConfig',
      {
        useJsCodeshift: true,
      }
    )
  })

  test('App.tsx with existing graphQLClientConfig in separate variable with non-standard name', async () => {
    await matchFolderTransform(
      'appGqlConfigTransform',
      'existingPropVariableCustomName',
      {
        useJsCodeshift: true,
      }
    )
  })
})
