import { defineConfig } from '@playwright/test'

import { basePlaywrightConfig } from '../basePlaywright.config'

// See https://playwright.dev/docs/test-configuration#global-configuration
export default defineConfig({
  ...basePlaywrightConfig,

  projects: [
    ...basePlaywrightConfig.projects,
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
  ],

  use: {
    baseURL: 'http://localhost:8910',
  },

  // Run your local dev server before starting the tests if you want to test
  // against that instead of spinning up a new server
  webServer: {
    command: 'yarn redwood serve',
    cwd: process.env.REDWOOD_TEST_PROJECT_PATH,
    url: 'http://localhost:8910',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },
})
