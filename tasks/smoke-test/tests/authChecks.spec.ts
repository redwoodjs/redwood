import { PlaywrightTestArgs, expect } from '@playwright/test'

import devServerTest, {
  DevServerFixtures,
} from '../playwright-fixtures/devServer.fixture'

devServerTest(
  'Auth checks',
  async ({ page, webUrl }: PlaywrightTestArgs & DevServerFixtures) => {
    await page.goto(`${webUrl}/profile`)

    // Click input[name="username"]
    await page.locator('input[name="username"]').click()
    // Fill input[name="username"]
    await page.locator('input[name="username"]').fill('testuser@bazinga.com')
    // Click input[name="password"]
    await page.locator('input[name="password"]').click()
    // Fill input[name="password"]
    await page.locator('input[name="password"]').fill('test123')
    // Click button:has-text("Login")
    await page.locator('button:has-text("Login")').click()

    // Double click text=ID
    await page.goto(`${webUrl}/profile`)

    const usernameRow = await page.waitForSelector('*css=tr >> text=EMAIL')
    expect(await usernameRow.innerHTML()).toBe(
      '<td>EMAIL</td><td>testuser@bazinga.com</td>'
    )

    const isAuthenticatedRow = await page.waitForSelector(
      '*css=tr >> text=isAuthenticated'
    )
    expect(await isAuthenticatedRow.innerHTML()).toBe(
      '<td>isAuthenticated</td><td>true</td>'
    )
  }
)
