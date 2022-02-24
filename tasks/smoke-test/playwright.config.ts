import type { PlaywrightTestConfig } from '@playwright/test'

// See https://playwright.dev/docs/test-configuration#global-configuration
const config: PlaywrightTestConfig = {
  timeout: 60_000,
}

export default config
