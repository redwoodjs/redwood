#!/usr/bin/env node

import { initConfig } from './config.js'
import { downloadTemplate } from './download.js'
import { handleError } from './error.js'
import { initialCommit } from './git.js'
import { install } from './install.js'
import { setInstallationDir } from './installationDir.js'
import { relaunchOnLatest, shouldRelaunch } from './latest.js'
import { printDone, printWelcome } from './messages.js'
import { checkNodeVersion, checkYarnInstallation } from './prerequisites.js'
import { sendTelemetry } from './telemetry.js'
import { upgradeToLatestCanary } from './upgradeToLatestCanary.js'
import { unzip } from './zip.js'

<<<<<<< HEAD
let config: Config | null = null

const startTime = Date.now()

=======
>>>>>>> main
try {
  const config = initConfig()

  if (shouldRelaunch(config)) {
    await relaunchOnLatest(config)
  } else {
    printWelcome()

    await checkNodeVersion(config)
    checkYarnInstallation(config)
    await setInstallationDir(config)
    const templateZipPath = await downloadTemplate(config)
    await unzip(config, templateZipPath)
    await upgradeToLatestCanary(config)
    await install(config)
    await initialCommit(config)

    printDone(config)
  }
} catch (e) {
  handleError(e)
}

await sendTelemetry(config, Date.now() - startTime)
