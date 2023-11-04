import { expect, PlaywrightTestArgs } from '@playwright/test'

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

  await page.getByLabel('Username').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByLabel('Full Name').fill(fullName)

  await page.getByRole('button', { name: 'Sign Up' }).click()

  // Wait for either...
  // - signup to succeed and redirect to the home page
  // - an error message to appear in a toast
  await Promise.race([
    page.waitForURL('/'),
    expect(
      page.getByText(`Username \`${email}\` already in use`)
    ).toBeVisible(),
  ])
}

export const loginAsTestUser = async ({
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
}: AuthUtilsParams) => {
  await page.goto('/login')

  await page.getByLabel('Username').fill(email)
  await page.getByLabel('Password').fill(password)

  await page.getByRole('button', { name: 'Login' }).click()

  await page.waitForURL('/')
}
