import { describe, it } from 'vitest'

import { matchTransformSnapshot } from '../../../../testUtils/matchTransformSnapshot'

describe('addOgImageMiddleware', () => {
  it('Handles the default TSX case', async () => {
    await matchTransformSnapshot('addOgImageMiddleware', 'defaultTsx')
  })

  it('Handles when OgImageMiddleware is already imported', async () => {
    await matchTransformSnapshot(
      'addOgImageMiddleware',
      'alreadyContainsImport',
    )
  })

  it('Handles when registerMiddleware function is already defined', async () => {
    await matchTransformSnapshot(
      'addOgImageMiddleware',
      'registerFunctionAlreadyDefined',
    )
  })
})
