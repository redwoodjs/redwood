import { PlaywrightTestArgs, expect } from '@playwright/test'

import storybookTest, {
  StorybookFixture,
} from '../playwright-fixtures/storybook.fixture'

storybookTest(
  'Smoke test storybook',
  async ({ port, page }: PlaywrightTestArgs & StorybookFixture) => {
    const STORYBOOK_URL = `http://localhost:${port}/`

    await page.goto(STORYBOOK_URL)

    // Click text=BlogPostCell
    await page.locator('text=BlogPostCell').click()
    // Click text=Empty
    await page.locator('text=Empty').click()
    await expect(page).toHaveURL(
      'http://localhost:7910/?path=/story/cells-blogpostcell--empty'
    )

    expect(page.frameLocator('#storybook-preview-iframe')).toHaveTextContent(
      'Bazinga'
    )

    // Click text=Failure
    await page.locator('text=Failure').click()
    await expect(page).toHaveURL(
      'http://localhost:7910/?path=/story/cells-blogpostcell--failure'
    )
    // Click text=Error: Oh no
    await page
      .frameLocator('#storybook-preview-iframe')
      .locator('text=Error: Oh no')
      .click()

    expect(page.frameLocator('#storybook-preview-iframe')).toHaveTextContent(
      'Error: Oh no'
    )

    // Check Loading
    await page.locator('text=Loading').click()
    await expect(page).toHaveURL(
      'http://localhost:7910/?path=/story/cells-blogpostcell--loading'
    )

    expect(page.frameLocator('#storybook-preview-iframe')).toHaveTextContent(
      'Loading...'
    )

    // Check Success
    await page.locator('text=Success').click()
    await expect(page).toHaveURL(
      'http://localhost:7910/?path=/story/cells-blogpostcell--success'
    )

    expect(page.frameLocator('#storybook-preview-iframe')).toHaveTextContent(
      'Mocked title'
    )
    expect(page.frameLocator('#storybook-preview-iframe')).toHaveTextContent(
      'Mocked body'
    )
  }
)
