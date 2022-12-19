import { PlaywrightTestConfig, devices} from '@playwright/test'
import { devices as replayDevices } from "@replayio/playwright";

// See https://playwright.dev/docs/test-configuration#global-configuration
const config: PlaywrightTestConfig = {
  timeout: 90_000,
  expect: {
    timeout: 10 * 1000,
  },

  // Leaving this here to make debugging easier, by uncommenting
  // use: {
  //   launchOptions: {
  //     slowMo: 500,
  //     headless: false,
  //   },
  // },
  projects: [
    {
      name: "replay-firefox",
      use: { ...replayDevices["Replay Firefox"] as any },
    },
    {
      name: "replay-chromium",
      use: { ...replayDevices["Replay Chromium"] as any },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chromium"] },
    },
  ],
}

export default config
