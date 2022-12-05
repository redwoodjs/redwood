import { Heroku } from './api'
import { HEROKU_ERRORS, IHerokuContext } from './interfaces'
import { Questions } from './questions'
import { Logger } from './stdio'

export async function authStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  Logger.out('Authenticating with Heroku...')
  const currentUser = await Heroku.currentUser()
  if (currentUser) {
    const email = await _handleAlreadyLoggedIn(ctx, currentUser)
    return {
      ...ctx,
      email,
    }
  } else {
    const email = await Heroku.login()
    if (!email) {
      throw new Error(HEROKU_ERRORS.NOT_LOGGED_IN)
    }
    return {
      ...ctx,
      email,
    }
  }
}

async function _handleAlreadyLoggedIn(
  { defaults }: IHerokuContext,
  currentUser: string
): Promise<string> {
  if (defaults) {
    Logger.out(`Using default Heroku account: ${currentUser}`)
    return currentUser
  }

  const shouldReauth = await Questions.shouldReAuthenticate(currentUser)

  if (shouldReauth) {
    return Heroku.reauth()
  }

  return currentUser
}
