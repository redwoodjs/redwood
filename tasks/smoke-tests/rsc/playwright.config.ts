import { defineConfig } from '@playwright/test'

import { basePlaywrightConfig } from '../basePlaywright.config'

export const projectData = {
  serveProcess: undefined,
}

// See https://playwright.dev/docs/test-configuration#global-configuration
export default defineConfig({
  ...basePlaywrightConfig,

  projects: [
    ...basePlaywrightConfig.projects,
    {
      name: 'setup',
      testMatch: 'setup.ts',
      teardown: 'kill server',
    },
    {
      name: 'kill server',
      testMatch: 'teardown.ts',
    },
  ],

  use: {
    baseURL: 'http://localhost:8910',
  },
})
