import { setTimeout } from 'node:timers/promises'

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

let pageWithClientBlocked: Page

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage()

  // Disable loading of client-side JS
  await page.route('**/entry.client.{js,tsx,ts,jsx}', (route) => route.abort())
  await page.route('**/App.{js,tsx,ts,jsx}', (route) => route.abort())

  pageWithClientBlocked = page
})

test('Check that homepage has content progressively loaded', async () => {
  await pageWithClientBlocked.goto('/')

  await pageWithClientBlocked.waitForSelector('article')

  const apiServerLoading = await pageWithClientBlocked.locator(
    'text=The RedwoodJS API server is not available or is currently reloading'
  )

  while (await apiServerLoading.isVisible()) {
    await pageWithClientBlocked.reload()
    await setTimeout(500)
  }

  await pageWithClientBlocked.pause()

  const cellSuccessState = await pageWithClientBlocked
    .locator('main')
    .innerHTML()

  expect(cellSuccessState).toMatch(/Welcome to the blog!/)
  expect(cellSuccessState).toMatch(/A little more about me/)
  expect(cellSuccessState).toMatch(/What is the meaning of life\?/)

  const navTitle = await pageWithClientBlocked
    .locator('header >> h1')
    .innerText()
  expect(navTitle).toBe('Redwood Blog')

  const navLinks = await pageWithClientBlocked.locator('nav >> ul').innerText()
  expect(navLinks.split('\n')).toEqual([
    'About',
    'Contact Us',
    'Admin',
    'Log In',
  ])

  pageWithClientBlocked.close()
})
