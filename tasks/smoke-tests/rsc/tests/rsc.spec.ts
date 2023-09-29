import { test, expect } from '@playwright/test'

test('Setting up RSC should give you a test project with a client side counter component', async ({
  page,
}) => {
  await page.goto('/')

  const h3 = await page.locator('h3').first().innerHTML()
  expect(h3).toMatch(/This is a server component/)
  await page.locator('p').filter({ hasText: 'Count: 0' }).first().isVisible()

  await page.locator('button').filter({ hasText: 'Increment' }).click()

  const count = await page.locator('p').first().innerText()
  expect(count).toMatch('Count: 1')

  page.close()
})
