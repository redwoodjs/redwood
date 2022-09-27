import fs from 'fs'
import path from 'path'

import latestVersion from 'latest-version'
import Listr from 'listr'
import semver from 'semver'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'

export const command = 'update'
export const description = 'Check for updates to RedwoodJS'

export const builder = (yargs) => {
  yargs
    .example('rw update')
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Ignore asynchronous locks',
      type: 'boolean',
    })
    .option('automatic', {
      description: 'Only run if update check is overdue',
      type: 'boolean',
      default: false,
    })
    .option('silent', {
      description: 'Do not render any console text or prompt the user',
      type: 'boolean',
      default: false,
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#update' //TODO: Create documentation for update command
      )}`
    )
    // Just to make an empty line
    .epilogue('')
}

export const handler = async ({ force, automatic, silent }) => {
  if (automatic && !isUpdateCheckDue()) {
    return
  }

  if (isUpdateLocked() && !force) {
    if (!silent) {
      console.log(
        'An update command is already running, please try again after in a few seconds.'
      )
    }
    return
  }

  let upgradeAvailable = false
  const updateTasks = new Listr([], { collapse: false })

  if (silent) {
    updateTasks.setRenderer('silent')
  }

  updateTasks.add({
    title: 'Checking if a newer RedwoodJS version is available',
    task: async (ctx, task) => {
      const versionStatus = await getUpdateVersionStatus()
      upgradeAvailable = versionStatus.upgradeAvailable

      if (upgradeAvailable) {
        createUpgradeVersionsFile(versionStatus)
        if (!silent) {
          // TODO: prompt if they want to upgrade now?
          // TODO: add on exit hook to run `yarn rw upgrade`
          task.title = 'New upgrade is available'
        }
      } else {
        removeUpgradeVersionsFile()
        task.title = 'No upgrade is available'
      }

      resetUpdateTimer()
    },
  })

  try {
    createUpdateLockFile()
    await updateTasks.run()
    if (upgradeAvailable && !silent) {
      console.log(upgradeAvailableMessage())
    }
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  } finally {
    removeUpdateLockFile()
  }
}

// Locking

function getUpdateLockFilePath() {
  return path.join(getPaths().base || '/tmp', '.redwood', 'update', 'lock')
}
function createUpdateLockFile() {
  try {
    fs.writeFileSync(getUpdateLockFilePath(), '')
  } catch (error) {
    if (error.code === 'ENOENT') {
      fs.mkdirSync(path.dirname(getUpdateLockFilePath()))
      fs.writeFileSync(getUpdateLockFilePath(), '')
    }
  }
}
function removeUpdateLockFile() {
  fs.unlinkSync(getUpdateLockFilePath())
}
function isUpdateLocked() {
  return fs.existsSync(getUpdateLockFilePath())
}

// Flag file

function getUpgradeVersionsFilePath() {
  return path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'update',
    'versions.json'
  )
}

function createUpgradeVersionsFile(versionStatus) {
  fs.writeFileSync(getUpgradeVersionsFilePath(), JSON.stringify(versionStatus))
}

function removeUpgradeVersionsFile() {
  try {
    fs.unlinkSync(getUpgradeVersionsFilePath())
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error('\nCould not delete update versions file\n')
    }
  }
}

export function isUpgradeAvailable() {
  return fs.existsSync(getUpgradeVersionsFilePath())
}

function readUpgradeVersionsFile() {
  return JSON.parse(fs.readFileSync(getUpgradeVersionsFilePath()))
}

// TODO: Confirm this is a sensible way to check the current version
async function getUpdateVersionStatus() {
  const packageJson = require(path.join(getPaths().base, 'package.json'))
  let localVersion = packageJson.devDependencies['@redwoodjs/core']
  while (!(localVersion.charAt(0) >= '0' && localVersion.charAt(0) <= '9')) {
    localVersion = localVersion.substring(1)
  }

  let tag = ''
  if (localVersion.includes('-')) {
    tag = localVersion.substring(localVersion.indexOf('-') + 1).trim()
    localVersion = localVersion.substring(0, localVersion.indexOf('-')).trim()
  }

  let remoteVersion
  try {
    remoteVersion = await latestVersion(
      '@redwoodjs/core',
      tag ? { version: tag } : {}
    )
  } catch (e) {
    throw new Error('Could not find the latest version')
  }

  const upgradeAvailable = semver.gt(remoteVersion, localVersion)
  const versionsStatus = {
    localVersion,
    remoteVersion,
    upgradeAvailable,
  }

  return versionsStatus
}

// Timer file

function getUpdateTimerFilePath() {
  return path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'update',
    'auto-timer'
  )
}

function resetUpdateTimer() {
  try {
    fs.writeFileSync(getUpdateTimerFilePath(), '')
  } catch (e) {
    try {
      fs.mkdirSync(path.dirname(getUpdateTimerFilePath()))
      fs.writeFileSync(getUpdateTimerFilePath(), '')
    } catch (error) {
      throw new Error('\nCould not create update timer file\n')
    }
  }
}

export function isUpdateCheckDue() {
  let timeOfLastUpdate
  try {
    timeOfLastUpdate = fs.statSync(getUpdateTimerFilePath()).mtimeMs
  } catch (error) {
    if (error.code === 'ENOENT') {
      resetUpdateTimer()
      return true
    }
  }
  const duePeriod = Date.now() - 24 * 60 * 60 * 1000
  if (timeOfLastUpdate < duePeriod) {
    return true
  }
  return false
}

// Misc

// TODO: Make this message prettier
// TODO: Show the newest version? Would take a small amount of extra time...
export function upgradeAvailableMessage() {
  const versionStatus = readUpgradeVersionsFile()
  let message = `${c.green(
    '\n------------------------------------------------------------------------------'
  )}\n`
  message += `${c.bold('RedwoodJS upgrade available')} (${
    versionStatus.localVersion
  } -> ${versionStatus.remoteVersion})\n`
  message += ` * Check the release notes at: "https://github.com/redwoodjs/redwood/releases"\n`
  message += ` * Then run "yarn rw upgrade" to upgrade\n`
  message += `${c.green(
    '------------------------------------------------------------------------------'
  )}`
  return message
}
