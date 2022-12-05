import { HEROKU_ERRORS, IHerokuContext } from './interfaces'
import { Logger, spawn } from './stdio'

export async function systemCheckStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  if (ctx.skipChecks) {
    Logger.out('Skipping system checks...')
    return ctx
  }
  Logger.out('Checking system requirements...')
  if (process.platform === 'win32') {
    throw new Error(HEROKU_ERRORS.IS_WINDOWS)
  }

  const uname = await spawn('uname -m -s')
  const [os, processor] = uname.split(' ')
  if (os !== 'Darwin' || processor !== 'x86_64') {
    throw new Error(HEROKU_ERRORS.NO_SUPPORT)
  }

  await _checkForHeroku()
  return ctx
}

async function _checkForHeroku(): Promise<void> {
  const hasDefaultBin = await spawn(`command -v heroku`)
  if (!hasDefaultBin) {
    throw new Error(HEROKU_ERRORS.NO_HEROKU)
  }
}
