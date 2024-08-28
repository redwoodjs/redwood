import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export async function checkHomePageCellRender(page: Page) {
  const cellSuccessState = await page.locator('main').innerHTML()

  expect(cellSuccessState).toMatch(/Welcome to the blog!/)
  expect(cellSuccessState).toMatch(/A little more about me/)
  expect(cellSuccessState).toMatch(/What is the meaning of life\?/)

  const navTitle = await page.locator('header >> h1').innerText()
  expect(navTitle).toBe('Redwood Blog')

  const navLinks = await page.locator('nav >> ul').innerText()
  expect(navLinks.split('\n')).toEqual([
    'About',
    'Contact Us',
    'Admin',
    'Log In',
  ])
}
