import addApiAliasToTsConfig from '../tsconfigForRouteHooks'

describe('tsconfigForRouteHooks', () => {
  it('Adds $api to web/tsconfig.json', async () => {
    await matchFolderTransform(addApiAliasToTsConfig, 'default')
  })
})
