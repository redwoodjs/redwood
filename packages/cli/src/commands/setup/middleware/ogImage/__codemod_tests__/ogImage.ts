import { describe, it } from 'vitest'

describe('OgImageMiddleware', () => {
  it('Handles the default TSX case', async () => {
    await matchTransformSnapshot('codemod', 'defaultTsx')
  })

  it('Handles when OgImageMiddleware is already imported', async () => {
    await matchTransformSnapshot('codemod', 'alreadyContainsImport')
  })

  it('Handles when registerMiddleware function is already defined', async () => {
    await matchTransformSnapshot('codemod', 'registerFunctionAlreadyDefined')
  })
})
