import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

async function checkRobotsTxt(page: Page) {
  const response = await page.goto('/robots.txt')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('text/plain')

  const content = await response.text()
  expect(content).toContain('User-agent: *')
}

async function checkFaviconPng(page: Page) {
  const response = await page.goto('/favicon.png')
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toContain('image/png')

  const content = await response.text()
  expect(content).toContain('PNG')
}

type StaticAssetTestCase = [string, (page: Page) => Promise<void>]
const staticAssetTests: StaticAssetTestCase[] = [
  ['check robots.txt', checkRobotsTxt],
  ['check favicon.png', checkFaviconPng],
]

export async function runTestCases() {
  for (const [name, testFn] of staticAssetTests) {
    test(name, async ({ page }) => {
      await testFn(page)
    })
  }
}
