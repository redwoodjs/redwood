import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import latestVersion from 'latest-version'
import Listr from 'listr'
import semver from 'semver'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'

import { validateTag } from './upgrade'

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
        'An update command is already running, please try again in a few seconds.'
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
    removeUpdateLockFile()
  } catch (e) {
    removeUpdateLockFile()
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
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

async function getUpdateVersionStatus() {
  // Read package.json and extract the @redwood/core version
  const packageJson = require(path.join(getPaths().base, 'package.json'))
  let localVersion = packageJson.devDependencies['@redwoodjs/core']

  // Remove any leading non-digits, i.e. ^ or ~
  while (!(localVersion.charAt(0) >= '0' && localVersion.charAt(0) <= '9')) {
    localVersion = localVersion.substring(1)
  }

  // Determine if the user has a tag (e.g. -rc, -canary), if so extract the tag from the version
  let tag = ''
  if (localVersion.includes('-')) {
    tag = localVersion.substring(localVersion.indexOf('-') + 1).trim()

    // Validate the local version, just incase the user has manually fiddled with it
    // no if needed to check as it throws an error if not successful, will be caught by listr
    validateTag(tag)
  }

  // Fetch the latest version from npm registry
  let remoteVersion
  try {
    remoteVersion = await latestVersion(
      '@redwoodjs/core',
      tag ? { version: tag } : {}
    )
  } catch (e) {
    throw new Error('Could not find the latest version')
  }

  // Is remote version higher than local?
  const upgradeAvailable = semver.gt(remoteVersion, localVersion)

  // Build an object with some details to be returned. Avoids the need for more parsing or remote calls elsewhere
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

export function upgradeAvailableMessage() {
  const versionStatus = readUpgradeVersionsFile()
  let message = `  Checklist:\n   1. Read release notes at: "https://github.com/redwoodjs/redwood/releases"  \n   2. Run "yarn rw upgrade" to upgrade  `
  return boxen(message, {
    padding: 0,
    margin: 1,
    title: `Upgrade Available: ${versionStatus.localVersion} -> ${versionStatus.remoteVersion}`,
    borderColor: `#ff845e`, // The RedwoodJS colour
    borderStyle: 'round',
  })
}
