import { test, expect } from '@playwright/test'

// UA taken from https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers
const BOT_USERAGENT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/W.X.Y.Z Safari/537.36'

test('Check that homepage has content fully rendered from the server, without JS', async ({
  browser,
}) => {
  // Rendering as a bot here, to make sure we're getting the full page and not
  // just some of it, with the rest streamed in later
  const botContext = await browser.newContext({
    userAgent: BOT_USERAGENT,
    // Even without JS, this should be a fully rendered page
    javaScriptEnabled: false,
  })

  const page = await botContext.newPage()

  await page.goto('/')

  // Appears when the navigation layout has successfully rendered
  await page.waitForSelector('main')

  // The NavigationLayout should have a random number in it
  const rnd = await page.locator('div#rnd').innerHTML()
  expect(rnd).toMatch(/\s*\d+\s*/)

  // expect there to only be one h1 heading element on the page
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1').first()).toHaveText('Hello Anonymous!!')

  // There should be a link to the about page
  await expect(page.locator('a').getByText('About')).toBeVisible()

  await botContext.close()
})

test('Make sure navigation works even without JS', async ({ browser }) => {
  // Rendering as a bot here, to make sure we're getting the full page and not
  // just some of it, with the rest streamed in later
  const botContext = await browser.newContext({
    userAgent: BOT_USERAGENT,
    // Even without JS, this should be a fully rendered page
    javaScriptEnabled: false,
  })

  const page = await botContext.newPage()

  await page.goto('/')

  // There should be a link to the about page
  const aboutLink = page.locator('a').getByText('About')
  expect(aboutLink).toBeVisible()

  // Clicking on the about link should take us to the about page
  await aboutLink.click()

  expect(page.url()).toMatch(/\/about$/)

  // expect there to only be one h1 heading element on the page
  await expect(page.locator('h1')).toHaveCount(1)
  await expect(page.locator('h1').first()).toHaveText('About Redwood')

  await botContext.close()
})

test('The page should have a form button, but it should be non-interactive', async ({
  browser,
}) => {
  // Rendering as a bot here, to make sure we're getting the full page and not
  // just some of it, with the rest streamed in later
  const botContext = await browser.newContext({
    userAgent: BOT_USERAGENT,
    // Even without JS, this should be a fully rendered page
    javaScriptEnabled: false,
  })

  const page = await botContext.newPage()

  await page.goto('/about')

  const paragraphs = page.locator('p')

  // Expect the count to be 0 when the page is first loaded
  expect(paragraphs.getByText('Count: 0')).toBeVisible()

  await page.getByRole('button', { name: 'Increment' }).click()

  // The count should stay at 0, because the page should not be interactive
  // (This is the SSRed version of the page, with no JS)
  await expect(paragraphs.getByText('Count: 0')).toBeVisible()

  await expect(paragraphs.getByText('RSC on client: enabled')).toBeVisible()
  await expect(paragraphs.getByText('RSC on server: enabled')).toBeVisible()

  await botContext.close()
})
