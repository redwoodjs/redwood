import { expect } from '@playwright/test'

import rwServeTest from '../playwright-fixtures/rwServe.fixture'

import { smokeTest } from './common'

rwServeTest('Smoke test with rw serve', ({ port, page }) =>
  smokeTest({ webServerPort: port, page })
)

rwServeTest('Visual check', async ({ page, port }) => {
  await page.goto(`http://localhost:${port}/`)

  // Wait till cell has finished rendering
  await page.textContent('text=Welcome to the blog!')

  expect(await page.screenshot()).toMatchSnapshot('landing.png', {
    threshold: 0.5, // reduce sensitivity of visual comparison
  })
})
