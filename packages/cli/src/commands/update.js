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

const UPDATE_TIMER_SHOW = 'update-show'
const UPDATE_TIMER_CHECK = 'update-check'
const UPDATE_FLAG_UPGRADE_AVAILABLE = 'upgrade-available'
const UPDATE_FLAG_SKIP = 'upgrade-skip'
const UPDATE_LOCK = 'update-command'

export const builder = (yargs) => {
  yargs
    .example('rw update')
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Ignore asynchronous locks',
      type: 'boolean',
    })
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

export const handler = async ({ force, silent, skip, unskip }) => {
  if (isLocked(UPDATE_LOCK) && !force) {
    if (!silent) {
      console.log(
        'An update command is already running, please try again in a few seconds.'
      )
    }
    return
  }

  const updateTasks = new Listr([], { collapse: false })
  if (silent) {
    updateTasks.setRenderer('silent')
  }

  // This is only here because we need to display to the user after listr tasks have run
  // TODO: When listr2 is available handle all output within in the listr2 task then this bool can be removed
  let upgradeAvailable = false

  updateTasks.add({
    enabled: () => skip || unskip,
    title: 'Handling skip flag',
    task: async (ctx, task) => {
      if (skip) {
        const updateData = readUpgradeFile()
        updateData.skipVersion = updateData.remoteVersion
        task.title = `Setting skip version: ${updateData.skipVersion}`
        setFlag(UPDATE_FLAG_SKIP)
      } else {
        task.title = 'Clearing the skip version'
        unsetFlag(UPDATE_FLAG_SKIP)
      }
    },
  })

  updateTasks.add({
    enabled: () => !(skip || unskip),
    title: 'Checking if a newer RedwoodJS version is available',
    task: async (ctx, task) => {
      const updateData = await getUpdateVersionStatus()
      upgradeAvailable = updateData.upgradeAvailable

      if (updateData.skipVersion !== updateData.remoteVersion) {
        unsetFlag(UPDATE_FLAG_SKIP)
        updateData.skipVersion = '0.0.0'
      }

      if (upgradeAvailable) {
        setFlag(UPDATE_FLAG_UPGRADE_AVAILABLE)
        createUpgradeFile(updateData)
        if (!silent) {
          // TODO: When listr2: prompt if they want to upgrade now? Can add on exit hook to run `yarn rw upgrade`
          task.title =
            updateData.skipVersion !== updateData.remoteVersion
              ? 'New upgrade is available'
              : 'New upgrade is available (you are currently skipping this upgrade)'
        }
      } else {
        unsetFlag(UPDATE_FLAG_UPGRADE_AVAILABLE)
        unsetFlag(UPDATE_FLAG_SKIP)
        removeUpgradeFile()
        task.title = 'No upgrade is available'
      }

      resetTimer(UPDATE_TIMER_CHECK)
    },
  })

  try {
    setLock(UPDATE_LOCK)
    await updateTasks.run()
    if (upgradeAvailable && !silent) {
      showUpgradeAvailableMessage()
    }
    unsetLock(UPDATE_LOCK)
  } catch (e) {
    unsetLock(UPDATE_LOCK)
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
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

  // Don't change the skip version
  let existingSkipVersion = '0.0.0'
  try {
    existingSkipVersion = readUpgradeFile().skipVersiom
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error('\nCould not read existing update-data file\n')
    }
  }

  // Build an object with some details to be returned. Avoids the need for more parsing or remote calls elsewhere
  const versionsStatus = {
    localVersion,
    remoteVersion,
    existingSkipVersion,
    upgradeAvailable,
  }

  return versionsStatus
}

export function isUpgradeAvailable() {
  return isFlagSet(UPDATE_FLAG_UPGRADE_AVAILABLE)
}

export function isUpdateCheckDue() {
  const updateCheckPeriod =
    process.env.REDWOOD_BACKGROUND_UPDATES_CHECK_PERIOD || 24 * 60
  return isTimerPassed(UPDATE_TIMER_CHECK, updateCheckPeriod)
}

export function isUpdateMessageDue() {
  const updateShowPeriod =
    process.env.REDWOOD_BACKGROUND_UPDATES_SHOW_PERIOD || 60
  return isTimerPassed(UPDATE_TIMER_SHOW, updateShowPeriod)
}

export function shouldSkip() {
  return isFlagSet(UPDATE_FLAG_SKIP)
}

function getUpgradeFilePath() {
  return path.join(getPaths().base || '/tmp', '.redwood', 'update-data.json')
}

function createUpgradeFile(updateData) {
  try {
    fs.writeFileSync(getUpgradeFilePath(), JSON.stringify(updateData))
  } catch (error) {
    throw new Error('\nCould not create update-data file\n')
  }
}

function readUpgradeFile() {
  return JSON.parse(fs.readFileSync(getUpgradeFilePath()))
}

function removeUpgradeFile() {
  try {
    fs.unlinkSync(getUpgradeFilePath())
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error('\nCould not delete update-data file\n')
    }
  }
}

export function getUpgradeAvailableMessage() {
  const updateData = readUpgradeFile()
  let message = `  Checklist:\n   1. Read release notes at: "https://github.com/redwoodjs/redwood/releases"  \n   2. Run "yarn rw upgrade" to upgrade  `
  return boxen(message, {
    padding: 0,
    margin: 1,
    title: `Redwood Upgrade Available: ${updateData.localVersion} -> ${updateData.remoteVersion}`,
    borderColor: `#ff845e`, // The RedwoodJS colour
    borderStyle: 'round',
  })
}

export function showUpgradeAvailableMessage() {
  console.log(getUpgradeAvailableMessage())
  resetTimer(UPDATE_TIMER_SHOW)
}

// Locks
// TODO: Move the generic lock functions some where more general, they could be used by other features needing a lock?

function setLock(name) {
  const lockPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'locks',
    `${name}`
  )
  if (!fs.existsSync(path.dirname(lockPath))) {
    try {
      fs.mkdirSync(path.dirname(lockPath))
    } catch (error) {
      throw new Error(`\nCould not create lock directory for lock ${name}!\n`)
    }
  }
  try {
    fs.writeFileSync(lockPath, '')
  } catch (error) {
    throw new Error(`\nCould not create lock ${name}!\n`)
  }
}

function unsetLock(name) {
  const lockPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'locks',
    `${name}`
  )
  try {
    fs.rmSync(lockPath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`\nCould not delete lock ${name}!\n`)
    }
  }
}

function isLocked(name) {
  const lockPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'locks',
    `${name}`
  )
  return fs.existsSync(lockPath)
}

// Flags
// TODO: Move the generic flag functions some where more general, they could be used by other features needing a persisted flags?

function setFlag(name) {
  const flagPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'flags',
    `${name}`
  )
  if (!fs.existsSync(path.dirname(flagPath))) {
    try {
      fs.mkdirSync(path.dirname(flagPath))
    } catch (error) {
      throw new Error(`\nCould not create flag directory for flag ${name}!\n`)
    }
  }
  try {
    fs.writeFileSync(flagPath, '')
  } catch (error) {
    throw new Error(`\nCould not create flag ${name}!\n`)
  }
}

function unsetFlag(name) {
  const flagPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'flags',
    `${name}`
  )
  try {
    fs.rmSync(flagPath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`\nCould not delete flag ${name}!\n`)
    }
  }
}

function isFlagSet(name) {
  const flagPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'flags',
    `${name}`
  )
  return fs.existsSync(flagPath)
}

// Timers
// TODO: Move the generic timer functions some where more general, they could be used by other features needing a persisted timer?

function isTimerPassed(name, minutes) {
  const timerPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'timers',
    `${name}`
  )

  if (!fs.existsSync(timerPath)) {
    resetTimer(name)
    return true
  }

  const timerDue = Date.now() - minutes * 60 * 1000
  const timerLastUpdated = fs.statSync(timerPath).mtimeMs

  return timerLastUpdated < timerDue
}

function resetTimer(name) {
  const timerPath = path.join(
    getPaths().base || '/tmp',
    '.redwood',
    'timers',
    name
  )

  if (!fs.existsSync(path.dirname(timerPath))) {
    try {
      fs.mkdirSync(path.dirname(timerPath))
    } catch (error) {
      throw new Error('\nCould not create timer directory!\n')
    }
  }
  try {
    fs.writeFileSync(timerPath, '')
  } catch (error) {
    throw new Error(`\nCould not create timer called ${name}!\n`)
  }
}
