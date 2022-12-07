import { Heroku } from './api'
import { HEROKU_ERRORS, IHerokuContext } from './interfaces'
import { Questions } from './questions'

export async function authStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  ctx.logger.debug('Authenticating with Heroku...')
  const currentUser = await Heroku.whoami()

  if (currentUser) {
    const email = await _handleAlreadyLoggedIn(ctx, currentUser)
    return {
      ...ctx,
      email,
    }
  } else {
    ctx.logger.debug('No Heroku account found... loggin in')
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
  { defaults, logger }: IHerokuContext,
  currentUser: string
): Promise<string> {
  if (defaults) {
    logger.debug(`Using default Heroku account: ${currentUser}`)
    return currentUser
  }

  const shouldReauth = await Questions.shouldReAuthenticate(currentUser)

  if (shouldReauth) {
    logger.debug('Reauthenticating with Heroku...')
    const userEmail = await Heroku.reauth()
    return userEmail
  }

  return currentUser
}
