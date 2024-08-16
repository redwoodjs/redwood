import { test, expect } from '@playwright/test'

import { loginAsTestUser, signUpTestUser } from '../../shared/common'

const testUser = {
  email: 'testuser@bazinga.com',
  password: 'test123',
  fullName: 'Test User',
}

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  await signUpTestUser({ page, ...testUser })

  await page.close()
})

test('useAuth hook, auth redirects checks', async ({ page }) => {
  await page.goto('/profile')

  // To check redirects to the login page
  await expect(page).toHaveURL(
    `http://localhost:8910/login?redirectTo=/profile`,
  )

  await loginAsTestUser({ page, ...testUser })

  await page.goto('/profile')

  const usernameRow = await page.waitForSelector('*css=tr >> text=EMAIL')
  await expect(await usernameRow.innerHTML()).toBe(
    '<td>EMAIL</td><td>testuser@bazinga.com</td>',
  )

  const isAuthenticatedRow = await page.waitForSelector(
    '*css=tr >> text=isAuthenticated',
  )
  await expect(await isAuthenticatedRow.innerHTML()).toBe(
    '<td>isAuthenticated</td><td>true</td>',
  )

  const isAdminRow = await page.waitForSelector('*css=tr >> text=Is Admin')
  await expect(await isAdminRow.innerHTML()).toBe(
    '<td>Is Admin</td><td>false</td>',
  )

  await page.goto('/')
  await page.getByText('Log Out').click()
  await expect(page.getByText('Log In')).toBeVisible()
})

const post = {
  title: 'Hello world! Soft kittens are the best.',
  body: 'Bazinga, bazinga, bazinga',
  authorId: '2',
}

test('requireAuth graphql checks', async ({ page }) => {
  // Try to create a post as an anonymous user.
  await createNewPost({ page })

  await expect(
    page
      .locator('.rw-form-error-title')
      .locator("text=You don't have permission to do that"),
  ).toBeTruthy()

  await page.goto('/')

  await expect(page.getByText(post.title)).not.toBeVisible()

  // Now log in and try again.
  await loginAsTestUser({ page, ...testUser })

  await createNewPost({ page })

  await page.goto('/')

  await expect(page.getByText(post.title)).toBeVisible()

  // Delete the post to keep this test idempotent.
  // Clicking "Delete" opens a confirmation dialog that we havee to accept.
  await page.goto('/posts')

  page.once('dialog', (dialog) => dialog.accept())

  await page
    .getByRole('row')
    .filter({ has: page.getByText(post.title) })
    .getByRole('button', { name: 'Delete' })
    .click()
})

async function createNewPost({ page }) {
  await page.goto('/posts/new')

  await page.getByLabel('Title').fill(post.title)
  await page.getByLabel('Body').fill(post.body)
  await page.getByLabel('Author id').fill(post.authorId)

  await page.getByRole('button', { name: 'Save' }).click()
}
