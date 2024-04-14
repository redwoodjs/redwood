import { test } from '@playwright/test'

import { staticAssetTests } from '../../shared/staticAssets'

for (const [name, testFn] of staticAssetTests) {
  test(name, async ({ page }) => {
    await testFn(page)
  })
}
