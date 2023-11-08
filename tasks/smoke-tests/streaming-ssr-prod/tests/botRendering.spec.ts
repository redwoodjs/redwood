import type { Page } from '@playwright/test'
import { test } from '@playwright/test'

import { checkDelayedPageRendering } from '../../shared/delayedPage'
import { checkHomePageCellRender } from '../../shared/homePage'

let botPageNoJs: Page

test.beforeAll(async ({ browser }) => {
  // UA taken from https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
  const botContext = await browser.newContext({
    userAgent:
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36',
    // Even without JS, this should be a fully rendered page
    javaScriptEnabled: false,
  })

  botPageNoJs = await botContext.newPage()
})

test.afterAll(() => {
  botPageNoJs.close()
})

test('Check that homepage has content rendered from the server', async () => {
  await botPageNoJs.goto('/')

  // Appears when Cell is successfully rendered
  await botPageNoJs.waitForSelector('article')

  await checkHomePageCellRender(botPageNoJs)
})

test('Check delayed page is NOT progressively rendered', async () => {
  await checkDelayedPageRendering(botPageNoJs, {
    expectedDelay: 0,
  })
})
