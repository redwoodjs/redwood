import { PlaywrightTestArgs, expect } from '@playwright/test'

import storybookTest, {
  StorybookFixture,
} from '../playwright-fixtures/storybook.fixture'

storybookTest(
  'Loads Cell Stories',
  async ({ port, page }: PlaywrightTestArgs & StorybookFixture) => {
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    // Click text=BlogPostCell
    await page.locator('text=BlogPostCell').click()
    // Click text=Empty
    await page.locator('text=Empty').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--empty`
    )

    expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Empty')

    // Click text=Failure
    await page.locator('text=Failure').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--failure`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Error: Oh no')

    // Check Loading
    await page.locator('text=Loading').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--loading`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Loading...')

    // Check Success
    // And make sure MSW Cell mocks are loaded as expected
    await page.locator('text=Success').click()
    await expect(page).toHaveURL(
      `http://localhost:${port}/?path=/story/cells-blogpostcell--success`
    )

    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked title')
    await expect(
      page.frameLocator('#storybook-preview-iframe').locator('body')
    ).toContainText('Mocked body')
  }
)
