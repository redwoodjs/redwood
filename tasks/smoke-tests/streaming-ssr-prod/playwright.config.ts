import { defineConfig } from '@playwright/test'

import { basePlaywrightConfig } from '../basePlaywright.config'

// See https://playwright.dev/docs/test-configuration#global-configuration
export default defineConfig({
  ...basePlaywrightConfig,
  use: {
    baseURL: 'http://localhost:8910',
    // headless: false,
  },

  // Run your local dev server before starting the tests
  webServer: {
    command: 'yarn redwood serve',
    cwd: process.env.REDWOOD_TEST_PROJECT_PATH,
    url: 'http://localhost:8910',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
})
