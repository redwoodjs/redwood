import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function checkDelayedPageRendering(
  page: Page,
  { expectedDelay }: { expectedDelay: number },
) {
  const delayedLogStatements: { message: string; time: number }[] = []

  page.on('console', (message) => {
    if (message.type() === 'log') {
      const messageText = message.text()

      if (messageText.includes('delayed by')) {
        delayedLogStatements.push({
          message: messageText,
          time: Date.now(),
        })
      }
    }
  })

  await page.goto('/delayed')

  expect(delayedLogStatements.length).toBe(4)

  delayedLogStatements.forEach((log, index) => {
    if (index > 0) {
      const timeDiff = log.time - delayedLogStatements[index - 1].time
      // If we're not expecting a delay
      // Check that timeDiff is less than 300ms (with margin of error)
      if (expectedDelay === 0) {
        expect(timeDiff).toBeLessThan(300)
      } else {
        // Allow a 300ms margin of error
        expect(timeDiff).toBeGreaterThan(expectedDelay - 300)
        expect(timeDiff).toBeLessThan(expectedDelay + 300)
      }
    }
  })

  // Check that its actually rendered on the page. Important when **not** progressively rendering
  await expect(page.locator('[data-test-id="delayed-text-1"]')).toHaveCount(1)
  await expect(page.locator('[data-test-id="delayed-text-2"]')).toHaveCount(1)
  await expect(page.locator('[data-test-id="delayed-text-3"]')).toHaveCount(1)
  await expect(page.locator('[data-test-id="delayed-text-4"]')).toHaveCount(1)
}
