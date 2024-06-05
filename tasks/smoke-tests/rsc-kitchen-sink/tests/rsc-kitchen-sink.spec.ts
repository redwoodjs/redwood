import { test, expect } from '@playwright/test'

test('Client components should work', async ({ page }) => {
  await page.goto('/')

  const h3 = await page.locator('h3').first().innerHTML()
  expect(h3).toMatch(/This is a client component/)
  await page.locator('p').filter({ hasText: 'Count: 0' }).first().isVisible()

  await page.locator('button').filter({ hasText: 'Increment' }).click()

  const count = await page
    .locator('p')
    .filter({ hasText: /Count: \d/ })
    .innerText()
  expect(count).toMatch('Count: 1')

  page.close()
})

test('CSS has been loaded', async ({ page }) => {
  await page.goto('/')

  // Check color of client component h3
  const clientH3 = page.getByText('This is a client component.')
  await expect(clientH3).toBeVisible()
  const clientH3Color = await clientH3.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('color')
  })
  // rgb(255, 165, 0) is orange
  expect(clientH3Color).toBe('rgb(255, 165, 0)')

  // Check font style of client component h3
  const clientH3Font = await clientH3.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('font-style')
  })
  expect(clientH3Font).toBe('italic')

  page.close()
})

test('Submitting the form should return a response', async ({ page }) => {
  await page.goto('/')

  const h1 = await page.locator('h1').innerText()
  expect(h1).toMatch(/Hello Anonymous!!/)

  const pageText = await page.locator('#redwood-app > div').innerText()
  expect(pageText).toMatch('This form has been sent 0 times')

  await page.getByRole('textbox').fill('Hello World')
  await page.getByRole('button').getByText('Send').click()

  const submittedPageText = page.locator('#redwood-app > div')
  await expect(submittedPageText).toHaveText(/This form has been sent 1 times/)

  // Expect an echo of our message back from the server
  await expect(page.locator('p').getByText('Hello World')).toBeVisible()

  // Expect to get five (random) words back from the server
  const words = await page
    .locator('p')
    .filter({ hasText: /Hello World/ })
    .innerText()
  expect(words.split('Hello World: ')[1].split(' ')).toHaveLength(5)

  page.close()
})

test('Page with Cell', async ({ page }) => {
  await page.goto('/user-examples')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('alice@example.com')).toBeVisible()

  page.close()
})

test("'use client' cell Empty state", async ({ page }) => {
  await page.goto('/empty-users')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/EmptyUsers - emptyUsers/)

  await expect(page.getByText('No emptyUsers yet.')).toBeVisible()

  const createLink = page.locator('a').getByText('Create one?')
  await expect(createLink).toBeVisible()

  page.close()
})

test("'use client' cell navigation", async ({ page }) => {
  await page.goto('/empty-users')

  await expect(page.getByText('No emptyUsers yet.')).toBeVisible()

  const createLink = page.locator('a').getByText('Create one?')
  await expect(createLink).toBeVisible()

  await createLink.click()

  page.waitForURL('/empty-users/new')

  await expect(page.getByText('New EmptyUser')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByText('Save')).toBeVisible()

  page.close()
})

test('Server Cell', async ({ page }) => {
  await page.goto('/user-examples/1')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('Email')).toBeVisible()
  await expect(page.getByText('jackie@example.com')).toBeVisible()

  await expect(page.locator('tr').nth(2)).toContainText(/Name\s*jackie/)
})

test('Server Cell - Error component', async ({ page }) => {
  await page.goto('/user-examples/7')

  const h1 = await page.locator('h1').innerHTML()
  expect(h1).toMatch(/UserExamples - userExamples/)

  await expect(page.getByText('UserExample not found')).toBeVisible()
})

test('Server Cell in Layout', async ({ page }) => {
  await page.goto('/')

  const mainText = await page.locator('.navigation-layout').innerText()

  // "The source of this server cell" should appear twice - once as a paragraph
  // above the code block and then once more inside the codeblock itself
  expect(mainText.match(/The source of this server cell/g)).toHaveLength(2)
})

test('middleware', async ({ page }) => {
  await page.goto('/self.mts')

  const bodyText = await page.locator('body').innerText()

  expect(bodyText).toMatch(/import { URL } from "node:url"/)
  expect(bodyText).toMatch(/self\.mts Middleware/)
  expect(bodyText).toMatch(/\.readFileSync\(__filename/)
})
