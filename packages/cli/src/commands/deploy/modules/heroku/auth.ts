import prompts from 'prompts'

import { HEROKU_ERRORS, IHerokuContext } from './interfaces'
import { Logger, spawn } from './stdio'

export async function authHerokuTask(ctx: IHerokuContext): Promise<void> {
  Logger.out('Authenticating with Heroku...')
  const currentUser = await _currentHerokuUser()
  if (currentUser) {
    await _handleAlreadyLoggedIn(ctx, currentUser)
  } else {
    await spawn('heroku login', { stdio: 'inherit', reject: true })
  }
  const lastAuthCheck = await _currentHerokuUser()
  if (!lastAuthCheck) {
    throw new Error(HEROKU_ERRORS.NOT_LOGGED_IN)
  }
}

async function _handleAlreadyLoggedIn(
  { defaults }: IHerokuContext,
  loggedInUser: string
): Promise<void> {
  if (defaults) {
    Logger.out(`Using default Heroku account: ${loggedInUser}`)
    return
  }
  const { useUser } = await prompts({
    type: 'confirm',
    name: 'useUser',
    message: `You are currently logged in as ${loggedInUser}. Do you want to use this user? (If not, you will be logged out and prompted to login again)`,
    initial: true,
  })

  if (!useUser) {
    Logger.out('Retry logging in...')
    await spawn('heroku logout')
    await spawn('heroku login', {
      stdio: 'inherit',
      reject: true,
    })
  }
}

async function _currentHerokuUser(): Promise<string> {
  const { stdout } = await spawn('heroku auth:whoami')
  return stdout || ''
}
