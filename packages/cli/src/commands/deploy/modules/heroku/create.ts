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
      return createApp(ctx, Attempt.SECOND)
    }
    const createdApp = stdout?.split(' | ')[0]
    if (!createdApp) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return { ...ctx, appName: createdApp }
  }

  const choice = await Questions.nameExistsChooseOption(ctx)

  if (choice === 'delete') {
    await Heroku.deleteApp(ctx.appName, { reject: true })
  }

  if (choice === 'new' || choice === 'delete') {
    const newAppName = await Questions.chooseAppName(ctx)
    const { stdout } = await Heroku.createApp(newAppName, {
      reject: true,
      stdout: 'pipe',
    })
    const createdApp = stdout?.split(' | ')[0]
    if (!createdApp) {
      throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
    }
    return {
      ...ctx,
      appName: createdApp,
    }
  }

  if (choice === 'exit') {
    Logger.out('Exiting...')
    process.exit(0)
  }

  throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
}
