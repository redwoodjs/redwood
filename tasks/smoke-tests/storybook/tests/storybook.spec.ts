import * as fs from 'fs'
import * as path from 'path'

import { test, expect } from '@playwright/test'
import type { PlaywrightTestArgs } from '@playwright/test'

test('Loads Cell stories', async ({ page }: PlaywrightTestArgs) => {
  await page.goto('/')

  // Click text=BlogPostCell
  await page.locator('text=/\\bBlogPostCell\\b/').click()
  await page.getByRole('link', { name: 'Loading' }).click()

  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/story/cells-blogpostcell--loading`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Loading...', {
    timeout: 15_000,
  })

  // Click text=Failure
  await page.locator('text=Failure').click()
  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/story/cells-blogpostcell--failure`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Error: Oh no')

  // Check Loading
  await page.locator('text=Empty').click()
  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/story/cells-blogpostcell--empty`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Empty')

  // Check Success
  // And make sure MSW Cell mocks are loaded as expected
  await page.locator('text=Success').click()
  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/story/cells-blogpostcell--success`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Mocked title')

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Mocked body')
})

test('Loads Cell mocks when Cell is nested in another story', async ({
  page,
}: PlaywrightTestArgs) => {
  await page.goto('/')

  // Click text=BlogPostCell
  await page.locator('text=BlogPostPage').click()

  // Click text=Empty
  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/story/pages-blogpostpage--primary`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Mocked title')

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText('Mocked body')
})

test('Mocks current user, and updates UI while dev server is running', async ({
  page,
}: PlaywrightTestArgs) => {
  const profileStoryPath = path.join(
    process.env.REDWOOD_TEST_PROJECT_PATH as string,
    'web/src/pages/ProfilePage/ProfilePage.stories.tsx',
  )

  // Modify profile page stories to mockCurrentUser
  const profilePageStoryContent = fs.readFileSync(profileStoryPath, 'utf-8')

  if (!profilePageStoryContent.includes('mockCurrentUser')) {
    const contentWithMockCurrentUser = profilePageStoryContent.replace(
      'export const Primary: Story = {}',
      MOCK_CURRENT_USER_CONTENT,
    )

    fs.writeFileSync(profileStoryPath, contentWithMockCurrentUser)
  }

  await page.goto('/')

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
    '<td>EMAIL</td><td>ba@zinga.com</td>',
  )

  const isAuthenticatedRow = await page
    .frameLocator('#storybook-preview-iframe')
    .locator('*css=tr >> text=isAuthenticated')
  await expect(await isAuthenticatedRow.innerHTML()).toBe(
    '<td>isAuthenticated</td><td>true</td>',
  )

  const isAdminRow = await page
    .frameLocator('#storybook-preview-iframe')
    .locator('*css=tr >> text=Is Admin')
  await expect(await isAdminRow.innerHTML()).toBe(
    '<td>Is Admin</td><td>true</td>',
  )
})

const MOCK_CURRENT_USER_CONTENT = `\
export const Primary: Story = {
  render: () => {
    mockCurrentUser({
      email: 'ba@zinga.com',
      id: 55,
      roles: 'ADMIN',
    })

    return <ProfilePage />
  }
}
`

test('Loads MDX Stories', async ({ page }: PlaywrightTestArgs) => {
  await page.goto('/')

  // Click Redwood link in left nav
  await page.locator('id=redwood--docs').click()

  await expect(page).toHaveURL(
    `http://localhost:7910/?path=/docs/redwood--docs`,
  )

  await expect(
    page.frameLocator('#storybook-preview-iframe').locator('body'),
  ).toContainText(
    'Redwood is an opinionated, full-stack, JavaScript/TypeScript web application framework designed to keep you moving fast as your app grows from side project to startup.',
  )
})
