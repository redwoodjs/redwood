import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'
// import { devices as replayDevices } from '@replayio/playwright'

// See https://playwright.dev/docs/test-configuration#global-configuration
export const basePlaywrightConfig: PlaywrightTestConfig = {
  testDir: './tests',

  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: !!process.env.CI,

  // Retry on CI only.
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  projects: [
    // {
    //   name: 'replay-chromium',
    //   use: { ...(replayDevices['Replay Chromium'] as any) },
    // },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'replay-firefox',
    //   use: { ...(replayDevices['Replay Firefox'] as any) },
    // },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Use the Replay.io reporter in CI for debugging.
  reporter: process.env.CI ? '@replayio/playwright/reporter' : 'list',
}
