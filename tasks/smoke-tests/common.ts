import { expect } from '@playwright/test'
import type { PlaywrightTestArgs } from '@playwright/test'

export async function smokeTest({ page }: PlaywrightTestArgs) {
  await page.goto('/')

  // Check that the blog posts are being loaded.
  // Avoid checking titles because we edit them in other tests.
  await page.textContent('text=Meh waistcoat succulents umami')
  await page.textContent('text=Raclette shoreditch before they sold out lyft.')
  await page.textContent(
    'text=baby single- origin coffee kickstarter lo - fi paleo skateboard.'
  )

  const bgBlue700 = 'rgb(29, 78, 216)'
  expect(
    await page
      .locator('#redwood-app > header')
      .evaluate((e) => window.getComputedStyle(e).backgroundColor)
  ).toBe(bgBlue700)

  const textBlue400 = 'rgb(96, 165, 250)'
  expect(
    await page
      .locator('header a')
      .filter({ hasText: 'Redwood Blog' })
      .evaluate((e) => window.getComputedStyle(e).color)
  ).toBe(textBlue400)

  // Click text=About
  await page.click('text=About')

  expect(page.url()).toBe('http://localhost:8910/about')

  await page.textContent(
    'text=This site was created to demonstrate my mastery of Redwood: Look on my works, ye'
  )
  // Click text=Contact
  await page.click('text=Contact')
  expect(page.url()).toBe('http://localhost:8910/contact')

  // Click text=Admin
  await page.click('text=Admin')
  expect(page.url()).toBe('http://localhost:8910/posts')
}

interface AuthUtilsParams {
  email?: string
  password?: string
  fullName?: string
  page: PlaywrightTestArgs['page']
}

export const signUpTestUser = async ({
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
  fullName = 'Test User',
}: AuthUtilsParams) => {
  await page.goto('/signup')

  await page.locator('input[name="username"]').click()
  // Fill input[name="username"]
  await page.locator('input[name="username"]').fill(email)
  // Press Tab
  await page.locator('input[name="username"]').press('Tab')
  // Fill input[name="password"]
  await page.locator('input[name="password"]').fill(password)
  await page.locator('input[name="full-name"]').click()
  await page.locator('input[name="full-name"]').fill(fullName)

  const alreadyRegisteredErr = page.locator(
    `text=Username \`${email}\` already in use`
  )

  // Either wait for signup to succeed and redirect
  // Or get the username already registered error, either way is fine!
  await Promise.all([
    Promise.race([
      page.waitForURL('**/'),
      alreadyRegisteredErr.waitFor({ timeout: 5000 }),
    ]),
    page.locator('text=Sign Up').click(),
  ])

  console.log(`Signup successful for ${email}!`)
}

export const loginAsTestUser = async ({
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
}: AuthUtilsParams) => {
  await page.goto('/login')

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
    page.waitForURL('**/'),
    page.locator('button:has-text("Login")').click(),
  ])
}
