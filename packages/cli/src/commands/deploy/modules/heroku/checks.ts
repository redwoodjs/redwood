import { HEROKU_ERRORS } from './interfaces'
import { Logger, spawn } from './stdio'

export async function systemRequirementsTask(): Promise<void> {
  Logger.out('Checking system requirements...')
  if (process.platform === 'win32') {
    throw new Error(HEROKU_ERRORS.IS_WINDOWS)
  }

  const { stdout: uname = '' } = await spawn('uname -m -s')
  const [os, processor] = uname.split(' ')
  if (os !== 'Darwin' || processor !== 'x86_64') {
    throw new Error(HEROKU_ERRORS.NO_SUPPORT)
  }

  await _checkForHeroku()
}

async function _checkForHeroku(): Promise<void> {
  const { stdout: hasDefaultBin } = await spawn(`command -v heroku`)
  if (!hasDefaultBin) {
    throw new Error(HEROKU_ERRORS.NO_HEROKU)
  }
}
