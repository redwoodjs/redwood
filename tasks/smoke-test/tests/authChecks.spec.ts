import {
  expect,
  PlaywrightTestArgs,
  PlaywrightWorkerArgs,
} from '@playwright/test'

import devServerTest, {
  DevServerFixtures,
} from '../playwright-fixtures/devServer.fixture'

import { loginAsTestUser, signUpTestUser } from './common'

// Signs up a user before these tests

devServerTest.beforeAll(async ({ browser }: PlaywrightWorkerArgs) => {
  const page = await browser.newPage()

  await signUpTestUser({
    // @NOTE we can't access webUrl in beforeAll, so hardcoded
    // But we can switch to beforeEach if required
    webUrl: 'http://localhost:9000',
    page,
  })

  await page.close()
})

devServerTest(
  'useAuth hook, auth redirects checks',
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

devServerTest(
  'requireAuth graphql checks',
  async ({ page, webUrl }: DevServerFixtures & PlaywrightTestArgs) => {
    // Auth
    await page.goto(`${webUrl}/posts/1/edit`)

    await page.locator('input[name="title"]').fill('This is an edited title!')

    await page.click('text=SAVE')

    await page.goto(`${webUrl}/posts`)

    await expect(
      // Count posts with the edited title
      await page.locator('text=This is an edited title!').count()
    ).toBe(0)

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
    await expect(await page.locator('text=Login')).toBeTruthy()

    await expect(
      await page.locator('text=This is an edited title!').count()
    ).toBe(1)
  }
)
