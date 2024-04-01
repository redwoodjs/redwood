import { describe, it } from 'vitest'

import { matchTransformSnapshot } from '../../../../testUtils/matchTransformSnapshot'

describe('Rename verifier timestamp option', () => {
  it('Modifies simple Function', async () => {
    await matchTransformSnapshot('renameVerifierTimestamp', 'simple')
  })
})
