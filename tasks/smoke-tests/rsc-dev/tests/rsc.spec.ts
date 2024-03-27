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

test('CSS has been loaded', async ({ page }) => {
  await page.goto('/')

  // Check color of server component h3
  const serverH3 = page.getByText('This is a server component.')
  await expect(serverH3).toBeVisible()
  const serverH3Color = await serverH3.evaluate((el) => {
    return window.getComputedStyle(el).getPropertyValue('color')
  })
  // rgb(255, 165, 0) is orange
  expect(serverH3Color).toBe('rgb(255, 165, 0)')

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

test('RWJS_* env vars', async ({ page }) => {
  await page.goto('/about')

  await expect(page.getByText('RSC on client: enabled')).toBeVisible()

  page.close()
})
