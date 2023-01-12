import fs from 'fs'
import path from 'path'

import {
  BrowserContext,
  expect,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
} from '@playwright/test'
import execa from 'execa'

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
      'Contact Us',
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
    // Test that nested cell content is also rendered
    expect(mainContent).toMatch('user.two@example.com')
    expect(mainContent).not.toMatch('Welcome to the blog!')
    expect(mainContent).not.toMatch('A little more about me')

    const navTitle = await pageWithoutJs.locator('header >> h1').innerText()
    expect(navTitle).toBe('Redwood Blog')

    const navLinks = await pageWithoutJs.locator('nav >> ul').innerText()
    expect(navLinks.split('\n')).toEqual([
      'About',
      'Contact Us',
      'Admin',
      'Log In',
    ])

    pageWithoutJs.close()
  }
)

rwServeTest(
  'Check that <meta> tags are rendering the correct dynamic data',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()

    await pageWithoutJs.goto(`http://localhost:${port}/blog-post/1`)

    const metaDescription = pageWithoutJs.locator('meta[name="description"]')
    await expect(metaDescription).toHaveAttribute('content', 'Description 1')
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

    const aboutMeAnchorHref = (await aboutMeAnchor.getAttribute('href')) || ''
    expect(aboutMeAnchorHref).not.toEqual('')

    mainContent = await pageWithoutJs.locator('main').innerHTML()
    expect(mainContent).toMatch('A little more about me')
    expect(mainContent).not.toMatch('Welcome to the blog!')
    expect(mainContent).not.toMatch('What is the meaning of life?')
    expect(pageWithoutJs.url()).toMatch(aboutMeAnchorHref)

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

// We don't really need a server running here. So we could just use `test()`
// straight from playwright. But we do need to have the project built. And
// `rwServeTest()` does that. If we try to add project building to this test as
// well we will build twice, and we don't want that. Hence we use rwServeTest.
rwServeTest('prerender with broken gql query', async () => {
  const projectPath = process.env.PROJECT_PATH || ''

  const cellBasePath = path.join(
    projectPath,
    'web',
    'src',
    'components',
    'BlogPostsCell'
  )

  const cellPathJs = path.join(cellBasePath, 'BlogPostsCell.js')
  const cellPathTs = path.join(cellBasePath, 'BlogPostsCell.tsx')
  const cellPath = fs.existsSync(cellPathTs) ? cellPathTs : cellPathJs

  const blogPostsCell = fs.readFileSync(cellPath, 'utf-8')
  fs.writeFileSync(cellPath, blogPostsCell.replace('createdAt', 'timestamp'))

  try {
    await execa(`yarn rw prerender`, {
      cwd: projectPath,
      shell: true,
    })
  } catch (e) {
    expect(e.message).toMatch(
      'GQL error: Cannot query field "timestamp" on type "Post".'
    )
  }

  // Restore cell
  fs.writeFileSync(cellPath, blogPostsCell)

  // Make sure to restore any potentially broken/missing prerendered pages
  await execa(`yarn rw prerender`, {
    cwd: projectPath,
    shell: true,
  })
})

rwServeTest(
  'Waterfall prerendering (nested cells)',
  async ({ port }: ServeFixture & PlaywrightTestArgs) => {
    const pageWithoutJs = await noJsBrowser.newPage()

    // It's non-deterministic what id the posts get, so we're pretty generic
    // with what we're matching in this test case

    await pageWithoutJs.goto(`http://localhost:${port}/waterfall/2`)

    const mainContent = await pageWithoutJs.locator('main').innerHTML()
    expect(mainContent).toMatch(/<header.*<h2.*>[\w\s?!]+<\/h2><\/header>/)
    // Test that nested cell content is also rendered
    expect(mainContent).toMatch('class="author-cell"')
    expect(mainContent).toMatch(/user.(one|two)@example.com/)

    pageWithoutJs.close()
  }
)
