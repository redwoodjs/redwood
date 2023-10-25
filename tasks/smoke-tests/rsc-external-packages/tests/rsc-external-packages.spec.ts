import { test, expect } from '@playwright/test'

test('Client components should work', async ({ page }) => {
  await page.goto('/')

  const h3 = await page.locator('h3').first().innerHTML()
  expect(h3).toMatch(/This is a client component/)
  await page.locator('p').filter({ hasText: 'Count: 0' }).first().isVisible()

  await page.locator('button').filter({ hasText: 'Increment' }).click()

  const count = await page.locator('p').first().innerText()
  expect(count).toMatch('Count: 1')

  page.close()
})

test('Submitting the form should return a response', async ({ page }) => {
  await page.goto('/')

  const h3 = await page.locator('h1').innerHTML()
  expect(h3).toMatch(/Hello Redwood RSAs!!/)

  const pageText = await page.locator('#redwood-app > div').innerText()
  expect(pageText).toMatch('The form has been submitted 0 times.')

  await page.getByRole('textbox').fill('Hello World')
  await page.getByRole('button').getByText('Send').click()

  const submittedPageText = page.locator('#redwood-app > div')
  await expect(submittedPageText).toHaveText(
    /The form has been submitted 1 times./
  )

  // Expect an echo of our message back from the server
  const echo = await page.locator('p').first().innerText()
  expect(echo).toMatch('Hello World')

  // Expect to get five (random) words back from the server
  const words = await page.locator('p').nth(1).innerText()
  expect(words.split(' ')).toHaveLength(5)

  page.close()
})
