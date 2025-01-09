import { test, expect } from '@playwright/test'

import { loginAsTestUser } from '../../shared/common'

const testUser = {
  email: 'testuser@bazinga.com',
  password: 'test123',
  fullName: 'Test User',
}

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  await page.goto('/signup')

  await page.getByLabel('Username').fill(testUser.email)
  await page.getByLabel('Password').fill(testUser.password)

  await page.waitForTimeout(300)

  await page.getByRole('button', { name: 'Sign Up' }).click()

  // Wait for either...
  // - signup to succeed and redirect to the home page
  // - an error message because of duplicate user id (e.g. email)
  await Promise.race([
    page.waitForURL('/'),
    // TODO (RSC): When we get toasts working we should check for a toast
    // message instead of network stuff, like in signUpTestUser()
    page.waitForResponse(async (response) => {
      // Status >= 300 and < 400 is a redirect
      // We get that sometimes for things like
      // http://localhost:8910/assets/jsx-runtime-CGe0JNFD.mjs
      if (response.status() >= 300 && response.status() < 400) {
        return false
      }

      const body = await response.body()
      return (
        response.url().includes('middleware') &&
        body.includes(`Username \`${testUser.email}\` already in use`)
      )
    }),
  ])

  await page.close()

  const pageLogin = await browser.newPage()
  await loginAsTestUser({
    page: pageLogin,
    ...testUser,
    redirectUrl: '/profile',
  })

  await pageLogin.close()
})

test('Client components should work', async ({ page }) => {
  await page.goto('/')

  const h3 = await page.locator('h3').first().innerHTML()
  expect(h3).toMatch(/This is a client component/)
  await page.locator('p').filter({ hasText: 'Count: 0' }).first().isVisible()

  await page.locator('button').filter({ hasText: 'Increment' }).click()

  const count = await page
    .locator('p')
    .filter({ hasText: /Count: \d/ })
    .innerText()
  expect(count).toMatch('Count: 1')

  page.close()
})

test('CSS has been loaded', async ({ page }) => {
  await page.goto('/')

  // Check color of client component h3
  const clientH3 = page.getByText('This is a client component.')
  await expect(clientH3).toBeVisible()
  const clientH3Color = await clientH3.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('color')
  })
  // rgb(255, 165, 0) is orange
  expect(clientH3Color).toBe('rgb(255, 165, 0)')

  // Check font style of client component h3
  const clientH3Font = await clientH3.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('font-style')
  })
  expect(clientH3Font).toBe('italic')

  page.close()
})

test('Submitting the form should return a response', async ({ page }) => {
  await page.goto('/')

  const h1 = await page.locator('h1').innerText()
  expect(h1).toMatch(/Hello Anonymous!!/)

  const pageText = await page.locator('#redwood-app > div').innerText()
  expect(pageText).toMatch('This form has been sent 0 times')

  await page.getByRole('textbox').fill('Hello World')
  await page.getByRole('button').getByText('Send').click()

  const submittedPageText = page.locator('#redwood-app > div')
  await expect(submittedPageText).toHaveText(/This form has been sent 1 times/)

  // Expect an echo of our message back from the server
  await expect(page.locator('p').getByText('Hello World')).toBeVisible()

  // Expect to get five (random) words back from the server
  const words = await page
    .locator('p')
    .filter({ hasText: /Hello World/ })
    .innerText()
  expect(words.split('Hello World: ')[1].split(' ')).toHaveLength(5)

  page.close()
})

test('Page with Cell', async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/user-examples')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('alice@example.com')).toBeVisible()

  page.close()
})

test("'use client' cell Empty state", async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/empty-users')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/EmptyUsers - emptyUsers/)

  await expect(page.getByText('No emptyUsers yet.')).toBeVisible()

  const createLink = page.locator('a').getByText('Create one?')
  await expect(createLink).toBeVisible()

  page.close()
})

test("'use client' cell navigation", async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/empty-users')

  await expect(page.getByText('No emptyUsers yet.')).toBeVisible()

  const createLink = page.locator('a').getByText('Create one?')
  await expect(createLink).toBeVisible()

  await createLink.click()

  page.waitForURL('/empty-users/new')

  await expect(page.getByText('New EmptyUser')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByText('Save')).toBeVisible()

  page.close()
})

test('Server Cell', async ({ page }) => {
  await page.goto('/user-examples/1')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('Email')).toBeVisible()
  await expect(
    page.getByText(/(jackie|bob|alice|mark)@example\.com/),
  ).toBeVisible()

  await expect(page.locator('tr').nth(2)).toContainText(
    /Name\s*(jackie|bob|alice|mark)/,
  )
})

test('Server Cell - Error component', async ({ page }) => {
  await page.goto('/user-examples/7')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('UserExample not found')).toBeVisible()
})

test('Server Cell in Layout', async ({ page }) => {
  await page.goto('/')

  const mainText = await page.locator('.navigation-layout').innerText()

  // "The source of this server cell" should appear twice - once as a paragraph
  // above the code block and then once more inside the codeblock itself
  expect(mainText.match(/The source of this server cell/g)).toHaveLength(2)
})

test('middleware', async ({ page }) => {
  await page.goto('/self.mts')

  const bodyText = await page.locator('body').innerText()

  expect(bodyText).toMatch(/import { fileURLToPath } from "node:url"/)
  expect(bodyText).toMatch(/self\.mts Middleware/)
  expect(bodyText).toMatch(/\.readFileSync\(__filename/)
})

test('profile page, direct navigation', async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/profile')

  await expect(page.locator('h1')).toContainText('Profile')

  const tableText = await page.locator('table').innerText()
  // Depending on how many other users there are in the DB the ID might be
  // different. On CI there are (for now) 2 users. Locally, depending on the
  // test project the tests are run against there can be any number of users
  expect(tableText).toMatch(/ID\s+\d+/)
  expect(tableText).toMatch(/Is Admin\s+false/)
})

test('profile page, client side navigation', async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/')
  page.getByRole('link').filter({ hasText: 'Auth' }).nth(0).click()

  page.waitForURL('/profile')

  await expect(page.locator('h1')).toContainText('Profile')

  const tableText = await page.locator('table').innerText()
  expect(tableText).toMatch(/ID\s+\d+/)
  expect(tableText).toMatch(/Is Admin\s+false/)
})

test('logout', async ({ page }) => {
  await loginAsTestUser({ page, ...testUser, redirectUrl: '/profile' })

  await page.goto('/profile')

  await page.getByRole('button', { name: 'Log Out' }).click()

  page.waitForURL('/')
})

test('Retrieving request details in a', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'smoke-test-cookie',
      value: 'this-cookie-is-set-by-smoke-tests',
      path: '/',
      domain: 'localhost:8910',
      expires: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now in seconds
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])

  await page.goto('/request')

  await expect(page.locator('h1')).toContainText('Request Details')

  const userAgentLine = await page
    .getByTestId('user-agent-header')
    .textContent()

  // User-Agent Header: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.6533.17 Safari/537.36
  // We don't care about the value specifically, just that it exists
  expect(userAgentLine).toMatch(/User-Agent Header:.*Chrome\/.*/)
  expect(userAgentLine).not.toContain('NO USER AGENT!')

  await expect(
    await page.getByTestId('smoke-test-cookie').textContent(),
  ).toEqual('Smoke Test Cookie: this-cookie-is-set-by-smoke-tests')
})
