import { checkReactRoot } from '../checkReactRoot'

describe('tsconfigForRouteHooks', () => {
  it('Checks the react root', async () => {
    await matchFolderTransform(checkReactRoot, 'default')
  })
})
