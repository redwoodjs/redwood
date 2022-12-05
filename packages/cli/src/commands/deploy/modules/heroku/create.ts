import { Heroku } from './api'
import { IHerokuContext, HEROKU_ERRORS, Attempt } from './interfaces'
import { Questions } from './questions'
import { Logger } from './stdio'

export async function createStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  Logger.out('Creating Heroku app...')
  const appName = await Questions.chooseAppName(ctx)
  return tryCreateApp({ ...ctx, appName }, Attempt.FIRST)
}

async function tryCreateApp(
  ctx: IHerokuContext,
  attempt: Attempt
): Promise<IHerokuContext> {
  if (attempt === Attempt.FIRST) {
    const createdApp = await Heroku.createApp(ctx.appName)
    if (createdApp?.includes('already taken')) {
      return tryCreateApp(ctx, Attempt.SECOND)
    }
    if (!createdApp) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, appName: createdApp }
  }

  const choice = await Questions.nameExistsChooseOption(ctx)

  if (choice === 'delete') {
    await Heroku.deleteApp(ctx.appName)
    return _lastTryCreate(ctx, ctx.appName)
  }

  if (choice === 'new') {
    const newAppName = await Questions.chooseAppName(ctx)
    return _lastTryCreate(ctx, newAppName)
  }

  throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
}

async function _lastTryCreate(ctx: IHerokuContext, name: string) {
  const createdApp = await Heroku.createApp(name)
  if (!createdApp) {
    throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
  }
  return {
    ...ctx,
    appName: createdApp,
  }
}
