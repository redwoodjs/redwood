import {
  PlaywrightTestArgs,
  expect,
  PlaywrightWorkerArgs,
} from '@playwright/test'

import devServerTest, {
  DevServerFixtures,
} from '../playwright-fixtures/devServer.fixture'

// Signs up a user before these tests

devServerTest.beforeAll(async ({ browser }: PlaywrightWorkerArgs) => {
  const page = await browser.newPage()

  await page.goto(`http://localhost:9000/signup`)

  await page.locator('input[name="username"]').click()
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill('testuser@bazinga.com')
  // Press Tab
  await page.locator('input[name="username"]').press('Tab')
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill('test123')

  const alreadyRegisteredErr = page.locator(
    'text=Username `testuser@bazinga.com` already in use'
  )

  await page.locator('text=Sign Up').click()

  // Either wait for signup to succeed and redirect
  // Or get the username already registered error, either way is fine!
  await Promise.race([
    page.waitForNavigation({ url: '**/' }),
    alreadyRegisteredErr.waitFor({ timeout: 2000 }),
  ])

  await page.close()
})

devServerTest(
  'useAuth checks',
  async ({ page, webUrl }: PlaywrightTestArgs & DevServerFixtures) => {
    await page.goto(`${webUrl}/profile`)

    // To check redirects to the login page
    await expect(page).toHaveURL(`http://${webUrl}/login?redirectTo=/profile`)

    await loginAsTestUser({ page, webUrl })

    await page.goto(`${webUrl}/profile`)

    const usernameRow = await page.waitForSelector('*css=tr >> text=EMAIL')
    await expect(await usernameRow.innerHTML()).toBe(
      '<td>EMAIL</td><td>testuser@bazinga.com</td>'
    )

    const isAuthenticatedRow = await page.waitForSelector(
      '*css=tr >> text=isAuthenticated'
    )
    await expect(await isAuthenticatedRow.innerHTML()).toBe(
      '<td>isAuthenticated</td><td>true</td>'
    )

    const isAdminRow = await page.waitForSelector('*css=tr >> text=Is Admin')
    await expect(await isAdminRow.innerHTML()).toBe(
      '<td>Is Admin</td><td>false</td>'
    )
  }
)

devServerTest('requireAuth graphql checks', async ({ page, webUrl }) => {
  // Auth
  await page.goto(`${webUrl}/posts/1/edit`)

  await page.locator('input[name="title"]').fill('This is an edited title!')

  // unAuthenticated
  await page.click('text=SAVE')
  await expect(
    page.locator("text=You don't have permission to do that")
  ).toBeTruthy()

  // Authenticated
  await loginAsTestUser({ webUrl, page })
  await page.goto(`${webUrl}/posts/1/edit`)
  await page.locator('input[name="title"]').fill('This is an edited title!')

  await Promise.all([
    page.waitForNavigation({ url: '**/' }),
    page.click('text=SAVE'),
  ])

  // Log Out
  await page.goto(`${webUrl}/`)
  await page.click('text=Log Out')
  await expect(page.locator('text=Login')).toBeTruthy()

  await expect(page.locator('text=This is an edited title!')).toBeTruthy()
})

const loginAsTestUser = async ({ webUrl, page }) => {
  await page.goto(`${webUrl}/login`)

  // Click input[name="username"]
  await page.locator('input[name="username"]').click()
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill('testuser@bazinga.com')
  // Click input[name="password"]
  await page.locator('input[name="password"]').click()
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill('test123')

  // Click button:has-text("Login")
  await Promise.all([
    page.waitForNavigation({ url: '**/' }),
    page.locator('button:has-text("Login")').click(),
  ])
}
