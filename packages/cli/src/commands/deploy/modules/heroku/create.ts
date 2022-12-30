import { colors } from '../../../../lib'

import { HerokuApi, HEROKU_ERRORS } from './api'
import { isAnyStepDisabled, type IHerokuContext } from './ctx'
import { createBoxen } from './messages'
import { clearStdout, sleep } from './stdio'

enum Attempt {
  SECOND,
  FIRST,
}

export async function createStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  if (!isAnyStepDisabled(ctx)) {
    clearStdout(createBoxen(colors.green('Creating Heroku app'), '🌱'))
    return _tryCreateApp(ctx, Attempt.FIRST)
  }
  return ctx
}

async function _tryCreateApp(
  ctx: IHerokuContext,
  attempt: Attempt
): Promise<IHerokuContext> {
  if (attempt === Attempt.FIRST) {
    const appUrl = await HerokuApi.create(ctx)
    if (appUrl.includes('already taken')) {
      return _tryCreateApp(ctx, Attempt.SECOND)
    }
    if (!appUrl) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, appUrl }
  }

  await HerokuApi.destroy(ctx)
  clearStdout(createBoxen(colors.green(`Destroyed old ${ctx.appName}`), '💣'))
  return _createOrFail(ctx)
}

async function _createOrFail(ctx: IHerokuContext) {
  const appUrl = await HerokuApi.create(ctx)
  if (!appUrl || appUrl.includes('already taken')) {
    throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
  }
  return {
    ...ctx,
    appUrl,
  }
}

export async function pushStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  if (!isAnyStepDisabled(ctx)) {
    await HerokuApi.addRemote(ctx)
    clearStdout(
      createBoxen(
        colors.green(
          `Pushing to heroku.\nWe are leaving your shell and entering heroku's build pipeline.\nThis may take a few minutes...\nLet's watch 🤗`
        ),
        '🚀'
      )
    )
    await sleep(5000)
    await HerokuApi.push(ctx)
  }
  return ctx
}
