import { expect } from '@playwright/test'

export const smokeTest = async ({ page, webServerPort }) => {
  // Go to http://localhost:8910/
  await page.goto(`http://localhost:${webServerPort}/`)

  // Check that the blog posts are being loaded
  await page.textContent('text=What is the meaning of life?')
  await page.textContent('text=A little more about me')

  // Click text=About
  await page.click('text=About')

  expect(page.url()).toBe(`http://localhost:${webServerPort}/about`)

  await page.textContent(
    'text=This site was created to demonstrate my mastery of Redwood: Look on my works, ye'
  )
  // Click text=Contact
  await page.click('text=Contact')
  expect(page.url()).toBe(`http://localhost:${webServerPort}/contact`)

  // Click text=Admin
  await page.click('text=Admin')
  expect(page.url()).toBe(`http://localhost:${webServerPort}/posts`)
}

export const signUpTestUser = async ({
  webUrl,
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
}) => {
  await page.goto(`${webUrl}/signup`)

  await page.locator('input[name="username"]').click()
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill(email)
  // Press Tab
  await page.locator('input[name="username"]').press('Tab')
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill(password)

  const alreadyRegisteredErr = page.locator(
    `text=Username \`${email}\` already in use`
  )

  await page.locator('text=Sign Up').click()

  // Either wait for signup to succeed and redirect
  // Or get the username already registered error, either way is fine!
  await Promise.race([
    page.waitForNavigation({ url: '**/' }),
    alreadyRegisteredErr.waitFor({ timeout: 2000 }),
  ])
}

export const loginAsTestUser = async ({
  webUrl,
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
}) => {
  await page.goto(`${webUrl}/login`)

  // Click input[name="username"]
  await page.locator('input[name="username"]').click()
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill(email)
  // Click input[name="password"]
  await page.locator('input[name="password"]').click()
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill(password)

  // Click button:has-text("Login")
  await Promise.all([
    page.waitForNavigation({ url: '**/' }),
    page.locator('button:has-text("Login")').click(),
  ])
}
