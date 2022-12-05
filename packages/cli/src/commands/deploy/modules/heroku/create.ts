import { Heroku } from './api'
import { IHerokuContext, HEROKU_ERRORS, Attempt } from './interfaces'
import { Questions } from './questions'
import { Logger } from './stdio'

export async function createStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  Logger.out('Creating Heroku app...')
  const appName = await Questions.chooseAppName(ctx)
  return createApp({ ...ctx, appName }, Attempt.FIRST)
}

async function createApp(
  ctx: IHerokuContext,
  attempt: Attempt
): Promise<IHerokuContext> {
  if (attempt === Attempt.FIRST) {
    const { stderr, stdout } = await Heroku.createApp(ctx.appName)
    if (stderr?.includes('already taken')) {
      await createApp(ctx, Attempt.SECOND)
    }
    if (stderr) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, createdApp: stdout }
  }
  const newAppName = await Questions.nameExistsChooseOption(ctx)
  const { stdout } = await Heroku.createApp(newAppName, { reject: true })
  return {
    ...ctx,
    createdApp: stdout,
  }
}
