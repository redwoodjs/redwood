import { expect } from '@playwright/test'

import devServerTest from '../playwright-fixtures/devServer.fixture'

import { smokeTest } from './common'

devServerTest('Smoke test with dev server', smokeTest)

devServerTest('Visual check', async ({ page, webServerPort }) => {
  await page.goto(`http://localhost:${webServerPort}/`)

  // Wait till cell has finished rendering
  await page.textContent('text=Welcome to the blog!')

  expect(await page.screenshot()).toMatchSnapshot('landing.png')
})
