import { test, expect } from '@playwright/test'

test('Submitting the form should return a response', async ({ page }) => {
  await page.goto('/')

  const h1 = await page.locator('h1').innerText()
  expect(h1).toMatch(/Hello Anonymous!!/)

  const pageText = await page.locator('#redwood-app > div').innerText()
  expect(pageText).toMatch('The form has been submitted 0 times.')

  await page.getByRole('textbox').fill('Hello World')
  await page.getByRole('button').click()

  const submittedPageText = page.locator('#redwood-app > div')
  await expect(submittedPageText).toHaveText(
    /The form has been submitted 1 times./,
  )

  // Expect an echo of our message back from the server
  const echo = await page.locator('p').first().innerText()
  expect(echo).toMatch('Hello World')

  // Expect to get five (random) words back from the server
  const words = await page.locator('p').nth(1).innerText()
  expect(words.split(' ')).toHaveLength(5)

  page.close()
})
