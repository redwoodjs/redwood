import { PlaywrightTestConfig } from '@playwright/test'
const config: PlaywrightTestConfig = {
  timeout: 60000,
  use: {
    // Browser options
    // headless: false,
    // slowMo: 1000,
    // Context options
    // viewport: { width: 1280, height: 720 },
    // ignoreHTTPSErrors: true,
    // Artifacts
    // screenshot: 'only-on-failure',
    // video: 'retry-with-video',
  },
}
export default config
