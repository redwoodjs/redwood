import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import latestVersion from 'latest-version'
import semver from 'semver'

import { validateTag } from '../commands/upgrade'

import { setLock, unsetLock } from './locking'

import { getPaths } from './index'

/**
 * @const {number} The number of milliseconds between update checks (24 hours)
 */
const CHECK_PERIOD = 24 * 60 * 60_000

/**
 * @const {number} The number of milliseconds between showing a user an update notification (1 hour)
 */
const SHOW_PERIOD = 60 * 60_000

/**
 * @const {string} The identifier used for the lock within the check function
 */
export const LOCK_IDENTIFIER = 'UPDATE-CHECK'

/**
 * Performs an update check to detect if a newer version of redwood is available and records the result to a file within .redwood for persistence
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
      throw new Error(
        `Could not find the latest version${tag ? ` with tag: ${tag}` : ''}`
      )
    }

    // Save the latest update information
    updateUpdateFile({
      localVersion,
      remoteVersion,
      lastChecked: Date.now(),
    })
  } finally {
    unsetLock(LOCK_IDENTIFIER)
  }
}

/**
 * Determines if an update check is due based on if enough time has elapsed since the last check
 * @return {boolean} True if an update check is overdue
 * @see {@link CHECK_PERIOD} for the time between notifications
 */
export function shouldCheck() {
  const data = readUpdateFile()
  return data.checkedAt < Date.now() - CHECK_PERIOD
}

/**
 * Determines if the user should see an update notification based on if a new version is available and enough time has elapsed since the last notification
 * @return {boolean} True if the user should see an update notification
 * @see {@link SHOW_PERIOD} for the time between notifications
 */
export function shouldShow() {
  const data = readUpdateFile()
  return (
    data.shownAt < Date.now() - SHOW_PERIOD &&
    semver.gt(data.remoteVersion, data.localVersion)
  )
}

/**
 * Prints the update notification message to the console and updates the stored shownAt property
 * @see {@link getUpgradeMessage} for the definition of the string which is printed
 */
export function showUpgradeMessage() {
  console.log(getUpgradeMessage())
  updateUpdateFile({ shownAt: Date.now() })
}

/**
 * Returns a nicely formatted string containing an update notification
 * @return {string} A specifically formatted update notification message
 */
export function getUpgradeMessage() {
  const data = readUpdateFile()
  let message = `  Checklist:\n   1. Read the release notes at: https://github.com/redwoodjs/redwood/releases  \n   2. Run "yarn rw upgrade" to upgrade`
  return boxen(message, {
    padding: 0,
    margin: 1,
    title: `Redwood Upgrade Available: ${data.localVersion} -> ${data.remoteVersion}`,
    borderColor: `#0b8379`, // The RedwoodJS colour
    borderStyle: 'round',
  })
}

/**
 * Reads update data from a file within .redwood
 * @return {Object} The update data object containing the localVersion, remoteVersion, checkedAt and shownAt properties
 */
function readUpdateFile() {
  const updateFilePath = path.join(
    getPaths().generated.base,
    'update-data.json'
  )
  try {
    return JSON.parse(fs.readFileSync(updateFilePath))
  } catch (error) {
    // Return the default if no existing update file is found
    if (error.code === 'ENOENT') {
      return {
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        checkedAt: 946684800000, // 2000-01-01T00:00:00.000Z
        shownAt: 946684800000, // 2000-01-01T00:00:00.000Z
      }
    }
    throw error
  }
}

/**
 * Writes update data to a file within .redwood for persistence
 * @param {Object} updateData The data to persist.
 * @param {string} updateData.localVersion The version of the users current redwood project
 * @param {string} updateData.remoteVersion The latest released version of redwood
 * @param {number} updateData.checkedAt The last time an update check was performed, in milliseconds
 * @param {number} updateData.shownAt The last time an update notification was shown to the user, in milliseconds
 */
function updateUpdateFile({
  localVersion,
  remoteVersion,
  checkedAt,
  shownAt,
} = {}) {
  const updateFilePath = path.join(
    getPaths().generated.base,
    'update-data.json'
  )
  const existingData = readUpdateFile()
  const updatedData = {
    localVersion: localVersion ?? existingData.localVersion,
    remoteVersion: remoteVersion ?? existingData.remoteVersion,
    checkedAt: checkedAt ?? existingData.checkedAt,
    shownAt: shownAt ?? existingData.shownAt,
  }
  fs.writeFileSync(updateFilePath, JSON.stringify(updatedData, null, 2))
}

function extractTagFromVersion(version) {
  let tag = version.substring(version.indexOf('-') + 1).trim()
  if (tag.includes('.')) {
    tag = tag.split('.')[0]
  }
  return tag
}
