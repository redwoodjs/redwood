import { addTypesReactResolution } from '../addTypesReactResolution'

describe('addTypesReactResolution', () => {
  it('adds resolutions', async () => {
    await matchFolderTransform(addTypesReactResolution, 'add')
  })
  it('appends to existing resolutions', async () => {
    await matchFolderTransform(addTypesReactResolution, 'append')
  })
})
