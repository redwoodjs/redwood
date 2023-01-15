import { expect, PlaywrightTestArgs } from '@playwright/test'

export const smokeTest = async ({ page, webServerPort }) => {
  // Go to http://localhost:8910/
  await page.goto(`http://localhost:${webServerPort}/`)

  // Check that the blog posts are being loaded
  // Avoid checking titles, because we edit them in other tests
  await page.textContent('text=Meh waistcoat succulents umami')
  await page.textContent('text=Raclette shoreditch before they sold out lyft.')
  await page.textContent(
    'text=baby single- origin coffee kickstarter lo - fi paleo skateboard.'
  )

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

interface AuthUtilsParams {
  webUrl: string
  email?: string
  password?: string
  fullName?: string
  page: PlaywrightTestArgs['page']
}

export const signUpTestUser = async ({
  webUrl,
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
  fullName = 'Test User',
}: AuthUtilsParams) => {
  await page.goto(`${webUrl}/signup`)

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
      page.waitForNavigation({ url: '**/' }),
      alreadyRegisteredErr.waitFor({ timeout: 5000 }),
    ]),
    page.locator('text=Sign Up').click(),
  ])

  console.log(`Signup successful for ${email}!`)
}

export const loginAsTestUser = async ({
  webUrl,
  page,
  email = 'testuser@bazinga.com',
  password = 'test123',
}: AuthUtilsParams) => {
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
