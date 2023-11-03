import { test, expect } from '@playwright/test'

import { loginAsTestUser, signUpTestUser } from '../../shared/common'

// Signs up a user before these tests

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  await signUpTestUser({ page })

  await page.close()
})

test('useAuth hook, auth redirects checks', async ({ page }) => {
  await page.goto('/profile')

  // To check redirects to the login page
  await expect(page).toHaveURL(
    `http://localhost:8910/login?redirectTo=/profile`
  )

  await loginAsTestUser({ page })

  await page.goto('/profile')

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

  // Log Out
  await page.goto('/')
  await page.click('text=Log Out')
  await expect(await page.locator('text=Login')).toBeTruthy()
})

test('requireAuth graphql checks', async ({ page }) => {
  // Create posts
  await createNewPost({ page })

  await expect(
    page
      .locator('.rw-form-error-title')
      .locator("text=You don't have permission to do that")
  ).toBeTruthy()

  await page.goto('/')

  await expect(
    await page
      .locator('article:has-text("Hello world! Soft kittens are the best.")')
      .count()
  ).toBe(0)

  await loginAsTestUser({
    page,
  })

  await createNewPost({ page })

  await page.goto('/')
  await expect(
    await page
      .locator('article:has-text("Hello world! Soft kittens are the best.")')
      .first()
  ).not.toBeEmpty()
})

async function createNewPost({ page }) {
  await page.goto('/posts/new')

  await page.locator('input[name="title"]').click()
  await page
    .locator('input[name="title"]')
    .fill('Hello world! Soft kittens are the best.')
  await page.locator('input[name="title"]').press('Tab')
  await page.locator('input[name="body"]').fill('Bazinga, bazinga, bazinga')
  await page.locator('input[name="authorId"]').fill('2')

  const permissionError = page
    .locator('.rw-form-error-title')
    .locator(`text=You don't have permission to do that`)

  // Either wait for success and redirect
  // Or get the error
  await Promise.all([
    Promise.race([
      page.waitForURL('**/'),
      permissionError.waitFor({ timeout: 5000 }),
    ]),
    await page.click('text=SAVE'),
  ])
}
