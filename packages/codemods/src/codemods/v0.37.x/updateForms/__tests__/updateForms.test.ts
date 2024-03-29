import { describe, test } from 'vitest'

import { matchTransformSnapshot } from '../../../../testUtils/matchTransformSnapshot'

describe('Update Forms', () => {
  test('Transforms javascript', async () => {
    await matchTransformSnapshot('updateForms', 'javascript')
  })

  test('Transforms typescript', async () => {
    await matchTransformSnapshot('updateForms', 'typescript')
  })
})
