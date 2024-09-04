import { describe, it } from 'vitest'

describe('Db codemod', () => {
  it('Handles the default TSX case', async () => {
    await matchTransformSnapshot('dbCodemod', 'defaultDb')
  })
})
