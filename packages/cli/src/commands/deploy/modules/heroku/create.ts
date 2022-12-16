import { HerokuApi } from './api'
import { IHerokuContext, HEROKU_ERRORS, Attempt } from './interfaces'

export async function createStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  ctx.logger.debug('Creating Heroku app...')
  return _tryCreateApp(ctx, Attempt.FIRST)
}

async function _tryCreateApp(
  ctx: IHerokuContext,
  attempt: Attempt
): Promise<IHerokuContext> {
  if (attempt === Attempt.FIRST) {
    const appUrl = await HerokuApi.create(ctx)
    if (appUrl?.includes('already taken')) {
      return _tryCreateApp(ctx, Attempt.SECOND)
    }
    if (!appUrl) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, appUrl }
  }
  await HerokuApi.destroy(ctx)
  return _createOrFail(ctx)
}

async function _createOrFail(ctx: IHerokuContext) {
  const appUrl = await HerokuApi.create(ctx)
  if (!appUrl) {
    throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
  }
  return {
    ...ctx,
    appUrl,
  }
}

export async function pushStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  await HerokuApi.addRemote(ctx)
  await HerokuApi.push()
  await HerokuApi.followLogs(ctx)
  return ctx
}
