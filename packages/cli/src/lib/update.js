import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import latestVersion from 'latest-version'
import semver from 'semver'

import { validateTag } from 'src/commands/upgrade'

import { setLock, unsetLock } from './locking'

import { getPaths } from './index'

/**
 * @const {number} The number of milliseconds between update checks (24 hours)
 */
const CHECK_PERIOD = 24 * 60 * 60_000 // 24 hours

/**
 * @const {number} The number of milliseconds between showing a user an update notification (1 hour)
 */
const SHOW_PERIOD = 60 * 60_000 // 1 hour

/**
 * @const {string} The identifier used for the lock within the check function
 */
export const LOCK_IDENTIFIER = 'UPDATE-CHECK'

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

export function shouldCheck() {
  const data = readUpdateFile()
  return data.checkedAt < Date.now() - CHECK_PERIOD
}

export function shouldShow() {
  const data = readUpdateFile()
  return (
    data.shownAt < Date.now() - SHOW_PERIOD &&
    semver.gt(data.remoteVersion, data.localVersion)
  )
}

export function showUpgradeMessage() {
  console.log(getUpgradeMessage())
  updateUpdateFile({ shownAt: Date.now() })
}

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
