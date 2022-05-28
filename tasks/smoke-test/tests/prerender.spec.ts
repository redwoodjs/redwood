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

rwServeTest(
  'Check that homepage is prerendered',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()
    await pageWithoutJs.goto(`http://localhost:${port}/`)

    const cellSuccessState = await pageWithoutJs.locator('main').innerHTML()
    expect(cellSuccessState).toMatch('Welcome to the blog!')
    expect(cellSuccessState).toMatch('A little more about me')
    expect(cellSuccessState).toMatch('What is the meaning of life?')

    const navTitle = await pageWithoutJs.locator('header >> h1').innerText()
    expect(navTitle).toBe('Redwood Blog')

    const navLinks = await pageWithoutJs.locator('nav >> ul').innerText()
    expect(navLinks.split('\n')).toEqual([
      'About',
      'Contact',
      'Admin',
      'Log In',
    ])

    pageWithoutJs.close()
  }
)

rwServeTest(
  'Check that a specific blog post is prerendered',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()

    // It's non-deterministic what id the posts get, so we have to first find
    // the url of a given post, and then navigate to that

    await pageWithoutJs.goto(`http://localhost:${port}/`)
    const meaningOfLifeHref = await pageWithoutJs
      .locator('a:has-text("What is the meaning of life?")')
      .getAttribute('href')

    await pageWithoutJs.goto(`http://localhost:${port}${meaningOfLifeHref}`)

    const mainContent = await pageWithoutJs.locator('main').innerHTML()
    expect(mainContent).toMatch('What is the meaning of life?')
    expect(mainContent).not.toMatch('Welcome to the blog!')
    expect(mainContent).not.toMatch('A little more about me')

    const navTitle = await pageWithoutJs.locator('header >> h1').innerText()
    expect(navTitle).toBe('Redwood Blog')

    const navLinks = await pageWithoutJs.locator('nav >> ul').innerText()
    expect(navLinks.split('\n')).toEqual([
      'About',
      'Contact',
      'Admin',
      'Log In',
    ])

    pageWithoutJs.close()
  }
)

rwServeTest(
  'Check that you can navigate from home page to specific blog post',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()
    await pageWithoutJs.goto(`http://localhost:${port}`)

    let mainContent = await pageWithoutJs.locator('main').innerHTML()
    expect(mainContent).toMatch('Welcome to the blog!')
    expect(mainContent).toMatch('A little more about me')
    expect(mainContent).toMatch('What is the meaning of life?')

    await pageWithoutJs.goto(`http://localhost:${port}/`)
    const aboutMeAnchor = await pageWithoutJs.locator(
      'a:has-text("A little more about me")'
    )

    await aboutMeAnchor.click()

    mainContent = await pageWithoutJs.locator('main').innerHTML()
    expect(mainContent).toMatch('A little more about me')
    expect(mainContent).not.toMatch('Welcome to the blog!')
    expect(mainContent).not.toMatch('What is the meaning of life?')
    expect(pageWithoutJs.url()).toMatch(
      await aboutMeAnchor.getAttribute('href')
    )

    pageWithoutJs.close()
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
    pageWithoutJs.close()
  }
)
