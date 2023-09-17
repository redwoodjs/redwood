import { test as setup } from '@playwright/test'

import { projectData } from '../playwright.config'

setup('Kill server', async () => {
  // Allow ample time for yarn to install everything
  setup.setTimeout(5 * 60 * 1000)

  console.log('pid', projectData.serveProcess.pid)
})
