import fs from 'fs'
import path from 'path'

import { PlaywrightTestArgs, expect } from '@playwright/test'

import storybookTest, {
  StorybookFixture,
} from '../playwright-fixtures/storybook.fixture'

storybookTest(
  'Loads Cell Stories',
  async ({ port, page, server }: PlaywrightTestArgs & StorybookFixture) => {
    // We do this to make sure playwright doesn't bring the server down
    console.log(server)
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    // Click text=BlogPostCell
    await page.locator('text=/\\bBlogPostCell\\b/').click()

    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--empty`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Empty')

    // Click text=Failure
    await page.locator('text=Failure').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--failure`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Error: Oh no')

    // Check Loading
    await page.locator('text=Loading').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--loading`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Loading...')

    // Check Success
    // And make sure MSW Cell mocks are loaded as expected
    await page.locator('text=Success').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--success`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked title')

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked body')
  }
)

storybookTest(
  'Loads Cell mocks when Cell is nested in another story',
  async ({ port, page, server }: PlaywrightTestArgs & StorybookFixture) => {
    // We do this to make sure playwright doesn't bring the server down
    console.log(server)
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    // Click text=BlogPostCell
    await page.locator('text=BlogPostPage').click()

    // Click text=Empty
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/pages-blogpostpage--generated`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked title')

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked body')
  }
)

storybookTest(
  'Mocks current user, and updates UI while dev server is running',
  async ({ port, page, server }: PlaywrightTestArgs & StorybookFixture) => {
    const profileStoryPath = path.join(
      process.env.PROJECT_PATH,
      'web/src/pages/ProfilePage/ProfilePage.stories.tsx'
    )

    // Modify profile page stories to mockCurrentUser
    const profilePageStoryContent = fs.readFileSync(profileStoryPath, 'utf-8')

    if (!profilePageStoryContent.includes('mockCurrentUser')) {
      const contentWithMockCurrentUser = profilePageStoryContent.replace(
        'export const generated = () => {',
        `export const generated = () => {
          mockCurrentUser({
          email: 'ba@zinga.com',
          id: 55,
          roles: 'ADMIN',
        })
      `
      )

      fs.writeFileSync(profileStoryPath, contentWithMockCurrentUser)
    }

    // We do this to make sure playwright doesn't bring the server down
    console.log(server)
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    await Promise.all([
      page.waitForLoadState(),
      page.waitForSelector('text=ProfilePage'),
    ])

    await page.locator('text=ProfilePage').click()

    try {
      await page
        .frameLocator('#storybook-preview-iframe')
        .locator('css=h1 >> text=Profile')
        .waitFor({ timeout: 5_000 })
    } catch {
      await page.reload()
    }

    const usernameRow = await page
      .frameLocator('#storybook-preview-iframe')
      .locator('*css=tr >> text=EMAIL')
    await expect(await usernameRow.innerHTML()).toBe(
      '<td>EMAIL</td><td>ba@zinga.com</td>'
    )

    const isAuthenticatedRow = await page
      .frameLocator('#storybook-preview-iframe')
      .locator('*css=tr >> text=isAuthenticated')
    await expect(await isAuthenticatedRow.innerHTML()).toBe(
      '<td>isAuthenticated</td><td>true</td>'
    )

    const isAdminRow = await page
      .frameLocator('#storybook-preview-iframe')
      .locator('*css=tr >> text=Is Admin')
    await expect(await isAdminRow.innerHTML()).toBe(
      '<td>Is Admin</td><td>true</td>'
    )
  }
)

storybookTest(
  'Loads MDX Stories',
  async ({ port, page, server }: PlaywrightTestArgs & StorybookFixture) => {
    // We do this to make sure playwright doesn't bring the server down
    console.log(server)
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    // Click Redwood link in left nav
    await page.locator('id=redwood--page').click()

    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/redwood--page`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText(
      'Redwood is an opinionated, full-stack, JavaScript/TypeScript web application framework designed to keep you moving fast as your app grows from side project to startup.'
    )
  }
)
