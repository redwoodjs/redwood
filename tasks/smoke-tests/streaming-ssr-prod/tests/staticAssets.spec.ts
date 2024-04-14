import { test } from '@playwright/test'

import { runTestCases } from '../../shared/staticAssets'

test.describe('Static assets', async () => {
  await runTestCases()
})
