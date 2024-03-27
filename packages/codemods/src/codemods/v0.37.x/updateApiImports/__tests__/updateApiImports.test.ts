import { describe, it } from 'vitest'

import { matchTransformSnapshot } from '../../../../testUtils/matchTransformSnapshot'

describe('Update API Imports', () => {
  it('Updates @redwoodjs/api imports', async () => {
    await matchTransformSnapshot('updateApiImports', 'apiImports')
  })
})
