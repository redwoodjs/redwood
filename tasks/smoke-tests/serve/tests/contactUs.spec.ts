import { test, expect } from '@playwright/test'
import type { PlaywrightTestArgs } from '@playwright/test'

export async function smokeTest({ page }: PlaywrightTestArgs) {
  // Navigate to the contact page
  await page.goto('/contact')

  // Check if the form elements are visible
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

  // Check if the redwood blog link from the layout is visible
  await expect(page.getByRole('link', { name: 'Redwood Blog' })).toBeVisible()

  // Fill out the form partially to make it dirty
  await page.getByLabel('Name').fill('John Doe')

  // Try to navigate away by clicking the "Redwood Blog" link
  const redwoodBlogLink = page.getByRole('link', { name: 'Redwood Blog' })
  await redwoodBlogLink.click()

  // Check if we're still on the contact page
  await expect(page).toHaveURL('/contact')

  // Check if the blocker buttons are displayed
  await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Abort' })).toBeVisible()

  // Abort the navigation
  await page.getByRole('button', { name: 'Abort' }).click()

  // Check if buttons disappeared
  await expect(page.getByRole('button', { name: 'Confirm' })).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Abort' })).not.toBeVisible()

  // Try to navigate away by clicking the "Redwood Blog" link again
  await redwoodBlogLink.click()

  // Confirm the navigation this time
  await page.getByRole('button', { name: 'Confirm' }).click()

  // Check if we've navigated to the link route
  await expect(page).toHaveURL('/')
}

test('Smoke test useBlocker', smokeTest)
