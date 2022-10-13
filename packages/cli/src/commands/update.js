import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import Enquirer from 'enquirer'
import latestVersion from 'latest-version'
import { Listr } from 'listr2'
import semver from 'semver'
import terminalLink from 'terminal-link'

import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'

import * as upgrade from './upgrade'

export const command = 'update'
export const description = 'Check for updates to RedwoodJS'

const SHOW_PERIOD = 60 * 60_000 // 1 hour
const CHECK_PERIOD = 24 * 60 * 60_000 // 24 hours

export const builder = (yargs) => {
  yargs
    .example('rw update')
    .option('silent', {
      description: 'Do not render any console text or prompt the user',
      type: 'boolean',
      default: false,
    })
    .option('skip', {
      description:
        'Prevents update notifications until a newer upgrade is available',
      type: 'boolean',
      default: false,
    })
    .option('unskip', {
      description: 'Removes any currently set skip',
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

export const handler = async ({ enquirer, listr2, silent, skip, unskip }) => {
  let upgradePostUpdate = false
  let upgradePostUpdateTag

  const updateTasks = new Listr(
    [
      {
        enabled: () => skip || unskip,
        title: 'Handling skip flag',
        task: async (ctx, task) => {
          const updateData = readUpgradeFile()
          if (skip) {
            task.title = `Setting skip version: ${updateData.remoteVersion}`
            updateData.skipVersion = updateData.remoteVersion
          } else {
            task.title = 'Clearing the skip version'
            updateData.skipVersion = '0.0.0'
            updateData.lastShown = Date.now() - 2 * SHOW_PERIOD
          }
          writeUpgradeFile(updateData)
        },
      },
      {
        enabled: () => !(skip || unskip),
        title: 'Checking for RedwoodJS upgrades',
        task: async (ctx, task) => {
          const updateData = await getUpdateVersionStatus()
          updateData.lastShown = Date.now()

          if (updateData.upgradeAvailable) {
            // reset skip if newer non-skip version is available
            if (updateData.skipVersion !== updateData.remoteVersion) {
              updateData.skipVersion = '0.0.0'
              updateData.lastShown = Date.now() - 2 * SHOW_PERIOD
            }

            if (!silent) {
              if (updateData.skipVersion === updateData.remoteVersion) {
                task.title = `Upgrade available: ${updateData.localVersion} -> ${updateData.remoteVersion} (you are currently skipping this upgrade)`
                return
              }

              // Must remove some whitespace since we put the message into the listr2 output rather than just console.log it ourselves
              task.title = getUpgradeAvailableMessage(updateData)
                .replace('   ╭', '╭')
                .replace('   ╰', '╰')

              upgradePostUpdateTag = extractTagFromVersion(
                updateData.localVersion
              )
              upgradePostUpdate = await task.prompt({
                type: 'confirm',
                name: 'answer',
                message: `Do you want to run "yarn rw upgrade" now?`,
                default: false,
              })
            }
          } else {
            task.title = 'No upgrade is available'
          }

          writeUpgradeFile(updateData)
        },
        options: { persistentOutput: true },
      },
    ],
    {
      rendererSilent: () => listr2?.rendererSilent || silent,
      injectWrapper: { enquirer: enquirer || new Enquirer() },
      rendererOptions: { collapse: false },
    }
  )

  try {
    await updateTasks.run()
    if (upgradePostUpdate) {
      upgrade.handler({ tag: upgradePostUpdateTag })
    }
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}

function extractTagFromVersion(version) {
  let tag = version.substring(version.indexOf('-') + 1).trim()
  if (tag.includes('.')) {
    tag = tag.split('.')[0]
  }
  return tag
}

async function getUpdateVersionStatus() {
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
    upgrade.validateTag(tag)
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

  // Don't change the skip version
  let skipVersion = readUpgradeFile().skipVersion

  // Build an object with some details to be returned. Avoids the need for more parsing or remote calls elsewhere
  const versionsStatus = {
    localVersion,
    remoteVersion,
    skipVersion,
    upgradeAvailable,
    lastChecked: Date.now(),
  }

  return versionsStatus
}

export function isUpdateCheckDue() {
  const updateData = readUpgradeFile()
  return updateData.lastChecked < Date.now() - CHECK_PERIOD
}

export function shouldShowUpgradeAvailableMessage() {
  const updateData = readUpgradeFile()
  return (
    updateData.upgradeAvailable &&
    updateData.skipVersion !== updateData.remoteVersion &&
    updateData.lastShown < Date.now() - SHOW_PERIOD
  )
}

function getUpgradeFilePath() {
  return path.join(getPaths().generated.base, 'update-data.json')
}

function writeUpgradeFile(updateData) {
  try {
    fs.writeFileSync(getUpgradeFilePath(), JSON.stringify(updateData))
  } catch (error) {
    throw new Error('\nCould not create update-data file\n')
  }
}

function readUpgradeFile() {
  try {
    return JSON.parse(fs.readFileSync(getUpgradeFilePath()))
  } catch (error) {
    if (error.code === 'ENOENT') {
      // default update-data.json file
      return {
        localVersion: '0.0.0',
        remoteVersion: '0.0.0',
        skipVersion: '0.0.0',
        upgradeAvailable: false,
        lastChecked: 946684800000, // 2000-01-01T00:00:00.000Z
        lastShown: 946684800000, // 2000-01-01T00:00:00.000Z
      }
    }
    throw new Error('Could not read update-data.json file!')
  }
}

function getUpgradeAvailableMessage(updateData) {
  let message = `  Checklist:\n   1. Read the release notes at: https://github.com/redwoodjs/redwood/releases  \n   2. Run "yarn rw upgrade" to upgrade  `
  return boxen(message, {
    padding: 0,
    margin: 1,
    title: `Redwood Upgrade Available: ${updateData.localVersion} -> ${updateData.remoteVersion}`,
    borderColor: `#ff845e`, // The RedwoodJS colour
    borderStyle: 'round',
  })
}

export function showUpgradeAvailableMessage() {
  try {
    const updateData = readUpgradeFile()
    console.log(getUpgradeAvailableMessage(updateData))
    updateData.lastShown = Date.now()
    writeUpgradeFile(updateData)
  } catch (error) {
    console.error('Could not show an available update message!')
    console.error(error)
  }
}
