import { test } from '@playwright/test'

import { checkDelayedPageRendering } from '../../shared/delayedPage'
import { checkHomePageCellRender } from '../../shared/homePage'

// UA taken from https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
const BOT_USERAGENT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36'

test('Check that homepage has content fully rendered from the server, without JS', async ({
  browser,
}) => {
  const botContext = await browser.newContext({
    userAgent: BOT_USERAGENT,
    // Even without JS, this should be a fully rendered page
    javaScriptEnabled: false,
  })

  const botPageNoJs = await botContext.newPage()

  await botPageNoJs.goto('/')

  // Appears when Cell is successfully rendered
  await botPageNoJs.waitForSelector('article')

  await checkHomePageCellRender(botPageNoJs)

  await botPageNoJs.close()
})

test('Check delayed page is NOT progressively rendered', async ({
  browser,
}) => {
  // For this test we need to enable JS, but block all client side scripts
  // So that we can check that expected delay is 0
  const botContext = await browser.newContext({
    userAgent: BOT_USERAGENT,
  })

  const botPageNoBundle = await botContext.newPage()

  await botPageNoBundle.route('**/*.*.{js,tsx,ts,jsx}', (route) =>
    route.abort(),
  )

  await checkDelayedPageRendering(botPageNoBundle, {
    expectedDelay: 0,
  })
})
