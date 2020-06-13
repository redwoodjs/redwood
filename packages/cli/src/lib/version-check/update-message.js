import { info } from 'log-symbols'
import terminalLink from 'terminal-link'

import { getVersions, initStorage, getHistory, setHistory } from './storage'

export async function registerExitMessage() {
  await initStorage()
  const shouldLog = await logWithBackoff()
  if (!shouldLog) return
  // NOTE: could move this check to exit to avoid off by one
  const storedVersion = await getVersions()
  process.on('exit', function (exitCode) {
    if (storedVersion !== undefined) {
      logMessage(storedVersion, exitCode)
    }
  })
}

// use exponential backoff to determine if this rw run should show upgrade message
// log - log - no - no - no - log - no - ...
async function logWithBackoff() {
  let shouldShowMessage = false
  let hist = await getHistory()
  if (hist.rwRunCounter === hist.messageCounter ** 2) {
    shouldShowMessage = true
    hist.messageCounter++
  }
  hist.rwRunCounter++
  await setHistory(hist)
  return shouldShowMessage
}

function logMessage(versions, exitCode, logger = console.log) {
  if (
    versions &&
    versions.current !== undefined &&
    versions.current !== versions.latest
  ) {
    logger(
      // add an extra blank line when not exiting with success
      exitCode !== 0 ? '\n' : '',
      info,
      `A Redwood upgrade is avalibile to ${versions.latest} from ${versions.current}`,
      '\n',
      info,
      `${terminalLink(
        'Check out the Release Notes before running `yarn rw upgrade`',
        'https://github.com/redwoodjs/redwood/releases/'
      )}`
    )
  }
}
