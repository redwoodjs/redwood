#!/usr/bin/env node

import { initConfig } from './config.js'
import { downloadTemplate } from './download.js'
import { ExitCodeError } from './error.js'
import { initialCommit } from './git.js'
import { install } from './install.js'
import { setInstallationDir } from './installationDir.js'
import { printDone, printWelcome } from './messages.js'
import { checkNodeVersion, checkYarnInstallation } from './prerequisites.js'
import { unzip } from './zip.js'

printWelcome()

const config = initConfig()

try {
  await checkNodeVersion(config)
  checkYarnInstallation(config)
  await setInstallationDir(config)
  const templateZipPath = await downloadTemplate(config)
  await unzip(config, templateZipPath)
  await install(config)
  await initialCommit(config)

  printDone(config)
} catch (e) {
  // using process.exitCode instead of `process.exit(1) to give Node a chance to properly
  // clean up
  // See https://github.com/eslint-community/eslint-plugin-n/blob/master/docs/rules/no-process-exit.md

  if (e instanceof ExitCodeError) {
    if (e.exitCode === 0) {
      console.log('👋 Exiting')
    } else {
      console.log()
      console.error('🚨 An error occurred:')
      console.error(e.message)
    }

    process.exitCode = e.exitCode
  } else {
    console.log()
    console.error('🚨 An error occurred:')
    console.error(e)
    process.exitCode = 1
  }
}
