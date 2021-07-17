import { expect } from '@playwright/test'

import test from './devServer.fixture'

test('test', async ({ page, port }) => {
  // Go to http://localhost:8910/
  await page.goto(`http://localhost:${port}/`)
  // Click text=About
  await page.click('text=About')

  expect(page.url()).toBe(`http://localhost:${port}/about`)

  await page.textContent(
    'text=This site was created to demonstrate my mastery of Redwood: Look on my works, ye'
  )
  // Click text=Contact
  await page.click('text=Contact')
  expect(page.url()).toBe(`http://localhost:${port}/contact`)

  // Click text=Admin
  await page.click('text=Admin')
  expect(page.url()).toBe(`http://localhost:${port}/posts`)
})
