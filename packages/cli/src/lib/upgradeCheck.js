import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import latestVersion from 'latest-version'
import semver from 'semver'

import { validateTag } from '../commands/upgrade'

import { setLock, unsetLock } from './locking'

import { getPaths } from './index'

/**
 * @typedef {{
 *   localVersion: string,
 *   remoteVersion: string,
 *   checkedAt: number,
 *   shownAt: number,
 * }} UpgradeData
 */

/**
 * @const {number} The number of milliseconds between upgrade checks (24 hours)
 */
const CHECK_PERIOD = 24 * 60 * 60_000

/**
 * @const {number} The number of milliseconds between showing a user an upgrade notification (24 hours)
 */
const SHOW_PERIOD = 24 * 60 * 60_000

/**
 * @const {number} The default datetime for shownAt and checkedAt in milliseconds, corresponds to 2000-01-01T00:00:00.000Z
 */
export const DEFAULT_DATETIME_MS = 946684800000

/**
 * @const {string} The identifier used for the lock within the check function
 */
export const LOCK_IDENTIFIER = 'UPDATE_CHECK'

/**
 * Performs an upgrade check to detect if a newer version of redwood is available and records the result to a file within .redwood for persistence
 */
export async function check() {
  try {
    setLock(LOCK_IDENTIFIER)

    // Read package.json and extract the @redwood/core version
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(getPaths().base, 'package.json'))
    )
    let localVersion = packageJson.devDependencies['@redwoodjs/core']

    // Remove any leading non-digits, i.e. ^ or ~
    while (!/\d/.test(localVersion.charAt(0))) {
      localVersion = localVersion.substring(1)
    }

    // Determine if the user has a tag (e.g. -rc, -canary), if so extract the tag from the version
    let tag = ''
    if (localVersion.includes('-')) {
      tag = extractTagFromVersion(localVersion)

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
      console.error(e)
      throw new Error(
        `Could not find the latest version${tag ? ` with tag: ${tag}` : ''}`
      )
    }

    // Save the latest upgrade information
    updateUpgradeDataFile({
      localVersion,
      remoteVersion,
      checkedAt: new Date().getTime(),
    })
  } finally {
    unsetLock(LOCK_IDENTIFIER)
  }
}

/**
 * Determines if background checks are enabled. Checks are enabled within the redwood.toml config or by the `REDWOOD_BACKGROUND_UPDATE_CHECKS_ENABLED` env var.
 * @return {boolean} `true` if background upgrade checks are enabled
 */
export function isEnabled() {
  return (
    // @MARK we plan to let users toggle this in redwood.toml, but can't decide on the name
    // getConfig().background.updateChecks ||
    process.env.REDWOOD_ENABLE_UPGRADE_CHECKS
  )
}

/**
 * Determines if an upgrade check is due based on if enough time has elapsed since the last check
 * @return {boolean} `true` if an upgrade check is overdue
 * @see {@link CHECK_PERIOD} for the time between notifications
 */
export function shouldCheck() {
  const data = readUpgradeDataFile()
  return data.checkedAt < new Date().getTime() - CHECK_PERIOD
}

/**
 * Determines if the user should see an upgrade notification based on if a new version is available and enough time has elapsed since the last notification
 * @return {boolean} `true` if the user should see an upgrade notification
 * @see {@link SHOW_PERIOD} for the time between notifications
 */
export function shouldShow() {
  const data = readUpgradeDataFile()
  return (
    semver.gt(data.remoteVersion, data.localVersion) &&
    data.shownAt < new Date().getTime() - SHOW_PERIOD
  )
}

/**
 * Prints the upgrade notification message to the console and updates the stored shownAt property
 * @see {@link getUpgradeMessage} for the definition of the string which is printed
 */
export function showUpgradeMessage() {
  console.log(getUpgradeMessage())
  updateUpgradeDataFile({ shownAt: new Date().getTime() })
}

/**
 * Returns a nicely formatted string containing an upgrade notification
 * @return {string} A specifically formatted upgrade notification message
 */
export function getUpgradeMessage() {
  const data = readUpgradeDataFile()

  let message = [
    '  Checklist:',
    '   1. Read the release notes at: https://github.com/redwoodjs/redwood/releases',
    '   2. Run "yarn rw upgrade" to upgrade',
  ].join('\n')

  return boxen(message, {
    padding: 0,
    margin: 1,
    title: `Redwood Upgrade Available: ${data.localVersion} -> ${data.remoteVersion}`,
    borderColor: '#0b8379', // The RedwoodJS colour
    borderStyle: 'round',
  })
}

/**
 * Reads upgrade data from a file within .redwood
 * @return {UpgradeData} The upgrade data object containing the localVersion, remoteVersion, checkedAt and shownAt properties
 */
export function readUpgradeDataFile() {
  const upgradeDataFilePath = path.join(
    getPaths().generated.base,
    'upgradeData.json'
  )

  try {
    return JSON.parse(fs.readFileSync(upgradeDataFilePath))
  } catch (error) {
    // Return the default if no existing upgrade file is found
    if (error.code === 'ENOENT') {
      return {
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: DEFAULT_DATETIME_MS,
        shownAt: DEFAULT_DATETIME_MS,
      }
    }

    throw error
  }
}

/**
 * Writes upgrade data to a file within .redwood for persistence
 * @param {UpgradeData} upgradeData The data to persist.
 */
function updateUpgradeDataFile({
  localVersion,
  remoteVersion,
  checkedAt,
  shownAt,
} = {}) {
  const existingData = readUpgradeDataFile()

  const isNewerUpgrade =
    remoteVersion && semver.gt(remoteVersion, existingData.remoteVersion)

  const updatedData = {
    localVersion: localVersion ?? existingData.localVersion,
    remoteVersion: remoteVersion ?? existingData.remoteVersion,
    checkedAt: checkedAt ?? existingData.checkedAt,
    // We reset the shownAt if a newer version becomes available
    shownAt:
      shownAt ?? (isNewerUpgrade ? DEFAULT_DATETIME_MS : existingData.shownAt),
  }

  fs.writeFileSync(
    path.join(getPaths().generated.base, 'upgradeData.json'),
    JSON.stringify(updatedData, null, 2)
  )
}

function extractTagFromVersion(version) {
  let tag = version.substring(version.indexOf('-') + 1).trim()
  if (tag.includes('.')) {
    tag = tag.split('.')[0]
  }
  return tag
}

export const EXCLUDED_COMMANDS = ['upgrade', 'ts-to-js']
