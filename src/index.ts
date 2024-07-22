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
import { upgradeToLatestCanary } from './upgradeToLatestCanary.js'
import { unzip } from './zip.js'

const config = initConfig()

if (await shouldRelaunch(config)) {
  await relaunchOnLatest(config)
} else {
  printWelcome()

  try {
    await checkNodeVersion(config)
    checkYarnInstallation(config)
    await setInstallationDir(config)
    const templateZipPath = await downloadTemplate(config)
    await unzip(config, templateZipPath)
    await upgradeToLatestCanary(config)
    await install(config)
    await initialCommit(config)

    printDone(config)
  } catch (e) {
    handleError(e)
  }
}
