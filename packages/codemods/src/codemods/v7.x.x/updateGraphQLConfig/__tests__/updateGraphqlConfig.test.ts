import { updateGraphqlConfig } from '../updateGraphqlConfig'

describe('updateGraphQLConfig', () => {
  it('Replaces the JS FatalErrorPage with a new version that includes development info', async () => {
    await matchFolderTransform(updateGraphqlConfig)
  })
})
