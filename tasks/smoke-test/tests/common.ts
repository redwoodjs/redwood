import { expect } from '@playwright/test'

export const smokeTest = async ({ page, webServerPort }) => {
  // Go to http://localhost:8910/
  await page.goto(`http://localhost:${webServerPort}/`)

  // Check that the blog posts are being loaded
  await page.textContent('text=Welcome to the blog!')
  await page.textContent('text=What is the meaning of life?')
  await page.textContent('text=A little more about me')

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
