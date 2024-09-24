import { setTimeout } from 'node:timers/promises'

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

import { checkHomePageCellRender } from '../../shared/homePage'

let pageWithClientBlocked: Page

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  // Disable loading of client-side JS
  await page.route('**/entry.client.{js,tsx,ts,jsx}', (route) => route.abort())
  await page.route('**/App.{js,tsx,ts,jsx}', (route) => route.abort())
  await page.route('**/index.*.{js,tsx,ts,jsx}', (route) => route.abort())

  pageWithClientBlocked = page
})

test.afterAll(() => {
  pageWithClientBlocked.close()
})

test('Check that homepage has content rendered from the server (progressively)', async () => {
  await pageWithClientBlocked.goto('/')

  // @NOTE: It shows loading when the fetch fails, so client side can recover.
  const apiServerLoading = pageWithClientBlocked.getByText('Loading...')

  while (await apiServerLoading.isVisible()) {
    await pageWithClientBlocked.reload()
    await setTimeout(500)
  }

  // Appears when Cell is successfully rendered
  await pageWithClientBlocked.waitForSelector('article')

  await checkHomePageCellRender(pageWithClientBlocked)
})

test('Check delayed page has content progressively rendered', async () => {
  const delayedLogStatements: { message: string; time: number }[] = []

  pageWithClientBlocked.on('console', (message) => {
    if (message.type() === 'log') {
      const messageText = message.text()

      if (messageText.includes('delayed by')) {
        delayedLogStatements.push({
          message: messageText,
          time: Date.now(),
        })
      }
    }
  })

  await pageWithClientBlocked.goto('/delayed')

  expect(delayedLogStatements.length).toBe(4)

  delayedLogStatements.forEach((log, index) => {
    if (index > 0) {
      const timeDiff = log.time - delayedLogStatements[index - 1].time

      // With room for error, approximately 1 second
      expect(timeDiff).toBeGreaterThan(600)
      expect(timeDiff).toBeLessThan(1400)
    }
  })

  // Check that its actually rendered on the page. Important when **not** progressively rendering
  await expect(
    pageWithClientBlocked.locator('[data-test-id="delayed-text-1"]'),
  ).toHaveCount(1)
  await expect(
    pageWithClientBlocked.locator('[data-test-id="delayed-text-2"]'),
  ).toHaveCount(1)
  await expect(
    pageWithClientBlocked.locator('[data-test-id="delayed-text-3"]'),
  ).toHaveCount(1)
  await expect(
    pageWithClientBlocked.locator('[data-test-id="delayed-text-4"]'),
  ).toHaveCount(1)
})
