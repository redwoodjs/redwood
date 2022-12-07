import { Heroku } from './api'
import { IHerokuContext, HEROKU_ERRORS, Attempt } from './interfaces'
import { Questions } from './questions'

export async function createStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  ctx.logger.debug('Creating Heroku app...')
  const appName = await Questions.chooseAppName(ctx)
  return _tryCreateApp({ ...ctx, appName }, Attempt.FIRST)
}

async function _tryCreateApp(
  ctx: IHerokuContext,
  attempt: Attempt
): Promise<IHerokuContext> {
  if (attempt === Attempt.FIRST) {
    const appUrl = await Heroku.create(ctx.appName)
    if (appUrl?.includes('already taken')) {
      return _tryCreateApp(ctx, Attempt.SECOND)
    }
    if (!appUrl) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, appUrl }
  }

  const choice = await Questions.nameExistsChooseOption(ctx)

  if (choice === 'delete') {
    await Heroku.destroy(ctx.appName)
    return _lastTryCreate(ctx)
  }

  if (choice === 'new') {
    const newAppName = await Questions.chooseAppName(ctx)
    return _lastTryCreate({ ...ctx, appName: newAppName })
  }

  throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
}

async function _lastTryCreate(ctx: IHerokuContext) {
  const appUrl = await Heroku.create(ctx.appName)
  if (!appUrl) {
    throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
  }
  return {
    ...ctx,
    appUrl,
  }
}
