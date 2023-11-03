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
    // @@MARK TODO awaiting react team feedback. I dont understand why React is still injecting JS instead of giving us
    // a fully formed HTML page
    // javaScriptEnabled: false,
  })

  const botPage = await botContext.newPage()
  await botPage.route('**/*.*.{js,tsx,ts,jsx}', (route) => route.abort())

  botPageNoJs = botPage
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
