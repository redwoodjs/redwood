// import { spawn, exec } from 'child_process'
import execa from 'execa'
import { getConfig } from '@redwoodjs/internal'

import { registerExitMessage } from './update-message'

exports.init = async function () {
  if (isDisabled()) return
  checkPackageVersions()
  registerExitMessage()
}

function checkPackageVersions() {
  const subprocess = execa('node', [`${__dirname}/update-process.js`], {
    detached: true,
    stdio: 'ignore',
  })
  subprocess.unref()
}

function isDisabled() {
  const config = getConfig().cli
  if (config && config.checkVersion === false) {
    return true
  } else {
    return false
  }
}
