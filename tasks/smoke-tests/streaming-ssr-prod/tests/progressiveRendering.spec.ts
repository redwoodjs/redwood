import type { Page } from '@playwright/test'
import { test } from '@playwright/test'

import { checkDelayedPageRendering } from '../../shared/delayedPage'
import { checkHomePageCellRender } from '../../shared/homePage'

let pageWithClientBlocked: Page

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  // Disable loading of client-side JS
  // Note that we don't want to disable JS entirely, because progressive rendering
  // requires JS injected in <script> tags to be executed
  await page.route('**/*.*.{js,tsx,ts,jsx}', (route) => route.abort())

  pageWithClientBlocked = page
})

test.afterAll(() => {
  pageWithClientBlocked.close()
})

test('Check that homepage has content rendered from the server (progressively)', async () => {
  await pageWithClientBlocked.goto('/')

  // Appears when Cell is successfully rendered
  await pageWithClientBlocked.waitForSelector('article')

  await checkHomePageCellRender(pageWithClientBlocked)
})

test('Check delayed page has content progressively rendered', async () => {
  await checkDelayedPageRendering(pageWithClientBlocked, {
    expectedDelay: 1000,
  })
})
