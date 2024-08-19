import * as fs from 'fs'
import * as path from 'path'

import { test, expect } from '@playwright/test'
import type {
  BrowserContext,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
} from '@playwright/test'
import execa from 'execa'

import { checkHomePageCellRender } from '../../shared/homePage'

let noJsBrowser: BrowserContext

test.beforeAll(async ({ browser }: PlaywrightWorkerArgs) => {
  noJsBrowser = await browser.newContext({
    javaScriptEnabled: false,
  })
})

test('Check that homepage is prerendered', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()
  await pageWithoutJs.goto('/')

  await checkHomePageCellRender(pageWithoutJs)

  pageWithoutJs.close()
})

test('Check that rehydration works for page not wrapped in Set', async ({
  page,
}: PlaywrightTestArgs) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto('/double')

  // Wait for page to have been rehydrated before getting page content.
  // We know the page has been rehydrated when it sends an auth request
  await page.waitForResponse((response) =>
    response.url().includes('/.redwood/functions/auth'),
  )

  await page.locator('h1').first().waitFor()
  const headerCount = await page
    .locator('h1', { hasText: 'DoublePage' })
    .count()
  expect(headerCount).toEqual(1)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText.match(/#7757/g)).toHaveLength(1)

  const title = await page.locator('title').innerText()
  expect(title).toBe('Double | Redwood App')

  expect(errors).toMatchObject([])

  page.close()
})

test('Check that rehydration works for page with Cell in Set', async ({
  page,
}: PlaywrightTestArgs) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto('/')

  // Wait for page to have been rehydrated and cells have fetched their data
  // before getting page content.
  // We know cells have started fetching data when we see graphql requests
  await page.waitForResponse((response) =>
    response.url().includes('/.redwood/functions/graphql'),
  )

  await page.locator('h2').first().waitFor()
  const mainText = await page.locator('main').innerText()
  expect(mainText.match(/Welcome to the blog!/g)).toHaveLength(1)
  expect(mainText.match(/A little more about me/g)).toHaveLength(1)

  // Something strange is going on here. Sometimes React generates errors,
  // sometimes it doesn't.
  // The problem is we have a Cell with prerendered content. Then when the
  // page is rehydrated JS kicks in and the cell fetches data from the
  // server. While it's getting the data "Loading..." is shown. This doesn't
  // match up with the content that was prerendered, so React complains.
  // We have a <Suspense> around the Cell, so React will stop at the
  // suspense boundary and do full CSR of the cell content (instead of
  // throwing away the entire page and do a CSR of the whole thing as it
  // would have done without the <Suspense>).
  // Until we fully understand why we only get the errors sometimes we can't
  // have this `expect` enabled
  // expect(errors).toMatchObject([])

  page.close()
})

test('Check that rehydration works for page with code split chunks', async ({
  page,
}: PlaywrightTestArgs) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(err.message)
  })

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  // This page uses Redwood Forms, and so does /posts/new. Webpack splits rw
  // forms out into a separate chunk. We need to make sure our prerender
  // code can handle that
  await page.goto('/contacts/new')

  // Wait for page to have been rehydrated before getting page content.
  // We know the page has been rehydrated when it sends an auth request
  await page.waitForResponse((response) =>
    response.url().includes('/.redwood/functions/auth'),
  )

  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Message')).toBeVisible()

  expect(errors).toMatchObject([])

  page.close()
})

test('Check that a specific blog post is prerendered', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()

  // It's non-deterministic what id the posts get, so we have to first find
  // the url of a given post, and then navigate to that

  await pageWithoutJs.goto('/')

  const meaningOfLifeHref = await pageWithoutJs
    .locator('a:has-text("What is the meaning of life?")')
    .getAttribute('href')

  await pageWithoutJs.goto(meaningOfLifeHref as string)

  const mainContent = await pageWithoutJs.locator('main').innerHTML()
  expect(mainContent).toMatch(/What is the meaning of life\?/)
  // Test that nested cell content is also rendered
  expect(mainContent).toMatch(/user\.two@example\.com/)
  expect(mainContent).not.toMatch(/Welcome to the blog!/)
  expect(mainContent).not.toMatch(/A little more about me/)

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
})

test('Check that meta-tags are rendering the correct dynamic data', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()

  await pageWithoutJs.goto('/blog-post/1')

  const metaDescription = await pageWithoutJs.locator(
    'meta[name="description"]',
  )

  const ogDescription = await pageWithoutJs.locator(
    'meta[property="og:description"]',
  )
  await expect(metaDescription).toHaveAttribute('content', 'Description 1')
  await expect(ogDescription).toHaveAttribute('content', 'Description 1')

  const title = await pageWithoutJs.locator('title').innerHTML()
  await expect(title).toBe('Post 1 | Redwood App')

  const ogTitle = await pageWithoutJs.locator('meta[property="og:title"]')
  await expect(ogTitle).toHaveAttribute('content', 'Post 1')
})

test('Check that you can navigate from home page to specific blog post', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()
  await pageWithoutJs.goto('/')

  let mainContent = await pageWithoutJs.locator('main').innerHTML()
  expect(mainContent).toMatch(/Welcome to the blog!/)
  expect(mainContent).toMatch(/A little more about me/)
  expect(mainContent).toMatch(/What is the meaning of life\?/)

  await pageWithoutJs.goto('/')
  const aboutMeAnchor = await pageWithoutJs.locator(
    'a:has-text("A little more about me")',
  )

  await aboutMeAnchor.click()

  const aboutMeAnchorHref = (await aboutMeAnchor.getAttribute('href')) || ''
  expect(aboutMeAnchorHref).not.toEqual('')

  mainContent = await pageWithoutJs.locator('main').innerHTML()
  expect(mainContent).toMatch(/A little more about me/)
  expect(mainContent).not.toMatch(/Welcome to the blog!/)
  expect(mainContent).not.toMatch(/What is the meaning of life\?/)
  expect(pageWithoutJs.url()).toMatch(
    new RegExp(escapeRegExp(aboutMeAnchorHref)),
  )

  pageWithoutJs.close()
})

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

test('Check that about is prerendered', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()
  await pageWithoutJs.goto('/about')

  const aboutPageContent = await pageWithoutJs.locator('main').innerText()
  expect(aboutPageContent).toBe(
    'This site was created to demonstrate my mastery of Redwood: Look on my works, ye mighty, and despair!',
  )
  pageWithoutJs.close()
})

// We don't really need a server running here. So we could just use `test()`
// straight from playwright. But we do need to have the project built. And
// `rwServeTest()` does that. If we try to add project building to this test as
// well we will build twice, and we don't want that. Hence we use rwServeTest.
test('prerender with broken gql query', async () => {
  // Running the prerender command twice takes much longer than typical tests should
  test.slow()

  const redwoodProjectPath = process.env.REDWOOD_TEST_PROJECT_PATH || ''

  const cellBasePath = path.join(
    redwoodProjectPath,
    'web',
    'src',
    'components',
    'BlogPostsCell',
  )

  const cellPathJs = path.join(cellBasePath, 'BlogPostsCell.jsx')
  const cellPathTs = path.join(cellBasePath, 'BlogPostsCell.tsx')
  const cellPath = fs.existsSync(cellPathTs) ? cellPathTs : cellPathJs

  const blogPostsCell = fs.readFileSync(cellPath, 'utf-8')
  fs.writeFileSync(cellPath, blogPostsCell.replace('createdAt', 'timestamp'))

  try {
    await execa.command(`yarn rw prerender`, {
      cwd: redwoodProjectPath,
      shell: true,
    })
  } catch (e) {
    expect(e.message).toMatch(
      /GQL error: Cannot query field "timestamp" on type "Post"\./,
    )
  }

  // Restore cell
  fs.writeFileSync(cellPath, blogPostsCell)

  // Make sure to restore any potentially broken/missing prerendered pages
  await execa.command(`yarn rw prerender`, {
    cwd: redwoodProjectPath,
    shell: true,
  })
})

test('Waterfall prerendering (nested cells)', async () => {
  const pageWithoutJs = await noJsBrowser.newPage()

  // It's non-deterministic what id the posts get, so we're pretty generic
  // with what we're matching in this test case

  await pageWithoutJs.goto('/waterfall/2')

  const mainContent = await pageWithoutJs.locator('main').innerHTML()
  expect(mainContent).toMatch(/<header.*<h2.*>[\w\s?!]+<\/h2><\/header>/)
  // Test that nested cell content is also rendered
  expect(mainContent).toMatch(/class="author-cell"/)
  expect(mainContent).toMatch(/user.(one|two)@example.com/)

  pageWithoutJs.close()
})
