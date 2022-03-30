import {
  BrowserContext,
  expect,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
} from '@playwright/test'

import rwServeTest from '../playwright-fixtures/rwServe.fixture'
import type { ServeFixture } from '../playwright-fixtures/rwServe.fixture'

let noJsBrowser: BrowserContext
rwServeTest.beforeAll(async ({ browser }: PlaywrightWorkerArgs) => {
  noJsBrowser = await browser.newContext({
    javaScriptEnabled: false,
  })
})

rwServeTest.afterAll(async () => {
  noJsBrowser.close()
})

rwServeTest(
  'Check that homepage is prerendered',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()
    await pageWithoutJs.goto(`http://localhost:${port}/`)

    const cellLoadingState = await pageWithoutJs.locator('main').innerHTML()
    expect(cellLoadingState).toBe('<div>Loading...</div>')

    const navTitle = await pageWithoutJs.locator('header >> h1').innerText()
    expect(navTitle).toBe('Redwood Blog')

    const navLinks = await pageWithoutJs.locator('nav >> ul').innerText()
    expect(navLinks.split('\n')).toEqual([
      'About',
      'Contact',
      'Admin',
      'Log In',
    ])
  }
)

rwServeTest(
  'Check that about is prerendered',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()
    await pageWithoutJs.goto(`http://localhost:${port}/about`)

    const aboutPageContent = await pageWithoutJs.locator('main').innerText()
    expect(aboutPageContent).toBe(
      'This site was created to demonstrate my mastery of Redwood: Look on my works, ye mighty, and despair!'
    )
  }
)
