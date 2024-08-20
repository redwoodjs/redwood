import { expect } from '@playwright/test'
import type { PlaywrightTestArgs } from '@playwright/test'

export async function smokeTest({ page }: PlaywrightTestArgs) {
  await page.goto('/')

  // Check that the blog posts load. We're deliberately not checking their titles because we edit them in other tests.
  await expect(
    page.getByText(
      'Meh waistcoat succulents umami asymmetrical, hoodie post-ironic paleo chillwave ',
    ),
  ).toBeVisible()
  await expect(
    page.getByText(
      'Raclette shoreditch before they sold out lyft. Ethical bicycle rights meh prism ',
    ),
  ).toBeVisible()
  await expect(
    page.getByText(
      "I'm baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hasht",
    ),
  ).toBeVisible()

  // CSS checks. We saw this break when we switched bundlers, so while it's not comprehensive, it's at least something.
  // While playwright recommends against using locators that are too-closely tied to the DOM, `#redwood-app` is a stable ID.
  const bgBlue700 = 'rgb(29, 78, 216)'
  expect(page.locator('#redwood-app > header')).toHaveCSS(
    'background-color',
    bgBlue700,
  )

  const textBlue400 = 'rgb(96, 165, 250)'
  expect(await page.getByRole('link', { name: 'Redwood Blog' })).toHaveCSS(
    'color',
    textBlue400,
  )

  // Check the about page.
  await page.getByRole('link', { name: 'About', exact: true }).click()
  expect(page.url()).toBe('http://localhost:8910/about')
  await page.getByText(
    'This site was created to demonstrate my mastery of Redwood: Look on my works, ye',
  )

  // Check the contact us page.
  await page.getByRole('link', { name: 'Contact Us' }).click()
  expect(page.url()).toBe('http://localhost:8910/contact')

  // Check the admin page.
  await page.getByRole('link', { name: 'Admin' }).click()
  expect(page.url()).toBe('http://localhost:8910/posts')
}

interface AuthUtilsParams {
  email?: string
  password?: string
  fullName?: string
  page: PlaywrightTestArgs['page']
  redirectUrl?: string
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
      page.getByText(`Username \`${email}\` already in use`),
    ).toBeVisible(),
  ])
}

export const loginAsTestUser = async ({
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
  redirectUrl = '/',
}: AuthUtilsParams) => {
  await page.goto('/login')

  await page.getByLabel('Username').fill(email)
  await page.getByLabel('Password').fill(password)

  await page.waitForTimeout(300)

  await page.getByRole('button', { name: 'Login' }).click()

  await page.waitForURL(redirectUrl)
}
