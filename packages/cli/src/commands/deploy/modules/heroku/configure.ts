import prompts from 'prompts'

import { IHerokuContext, HEROKU_ERRORS } from './interfaces'
import { Logger, spawn } from './stdio'

export async function createHerokuAppTask(ctx: IHerokuContext) {
  Logger.out('Creating Heroku app...')

  const appName = await askAppName(ctx)
  await _attemptToCreateApp({ ...ctx, appName }, false)
}

async function askAppName({
  appName,
  defaults,
}: IHerokuContext): Promise<string> {
  if (defaults) {
    Logger.out(`Using default app name: ${appName}`)
    return appName
  }
  const { selectedAppName } = await prompts([
    {
      type: 'text',
      name: 'selectedAppName',
      message: `Name your deployment app. [${appName}]?`,
      initial: appName,
    },
  ])
  return selectedAppName
}

async function _attemptToCreateApp(
  ctx: IHerokuContext,
  secondAttempt: boolean
): Promise<void> {
  try {
    await spawn(`heroku apps:create ${ctx.appName} --manifest`, {
      stdio: 'inherit',
      reject: true,
    })
    Logger.out(`Created Heroku app: ${ctx.appName}`)
  } catch (error: any) {
    if (error?.message.includes('already taken')) {
      return
    }

    if (error?.message.includes('verify your account')) {
      Logger.error(HEROKU_ERRORS.NEEDS_VERIFY)
      return
    }

    if (!secondAttempt) {
      await _secondCreateAttempt(ctx)
      return
    }

    throw new Error(HEROKU_ERRORS.APP_CREATE_FAIL)
  }
}

async function _secondCreateAttempt(ctx: IHerokuContext) {
  const { choice } = await prompts({
    type: 'select',
    name: 'choice',
    message: `App ${ctx.appName} already exists. What would you like to do? [Delete and Create]`,
    initial: 0,
    choices: [
      {
        title: `Delete ${ctx.appName} and recreate?`,
        value: 'deleteAndCreate',
      },
      { title: 'Select a new app name', value: 'newAppName' },
      { title: 'Exit', value: 'exit' },
    ],
  })
  if (choice === 'newAppName') {
    await prompts(
      {
        type: 'text',
        name: 'newAppName',
        message: 'Enter a new app name',
      },
      {
        onSubmit: async (_, answer) => {
          await _attemptToCreateApp({ ...ctx, appName: answer }, true)
        },
      }
    )
    return
  }

  if (choice === 'deleteAndCreate') {
    await _deleteApp(ctx)
    await _attemptToCreateApp(ctx, true)
    return
  }

  if (choice === 'exit') {
    Logger.out('Exiting...')
    process.exit(0)
  }

  throw new Error('Invalid choice')
}

async function _deleteApp({ appName }: IHerokuContext) {
  Logger.out('Deleting Heroku app...')
  await spawn(`heroku apps:destroy ${appName} --confirm ${appName}`)
}
