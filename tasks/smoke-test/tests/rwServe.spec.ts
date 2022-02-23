import { expect } from '@playwright/test'

import rwServeTest from '../playwright-fixtures/rwServe.fixture'

import { smokeTest } from './common'

rwServeTest('Smoke test with rw serve', ({ port, page }) =>
  smokeTest({ webServerPort: port, page })
)

// @NOTE: This may be a flaky test
// Keeping in for now, but should this start failing, we should take it out
// Linux snapshot created using github codespaces
rwServeTest('Visual check', async ({ page, port }) => {
  await page.goto(`http://localhost:${port}/`)

  // Wait till cell has finished rendering
  await page.textContent('text=Welcome to the blog!')

  expect(await page.screenshot()).toMatchSnapshot('landing.png', {
    threshold: 0.2, // reduce sensitivity of visual comparison
  })
})
