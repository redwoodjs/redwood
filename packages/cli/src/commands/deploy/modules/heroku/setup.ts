import fs from 'fs'
import path from 'path'

import prompts from 'prompts'

import { HEROKU_ERRORS } from './checks'
import { spawn, spawnInteractive } from './command'
import { IHerokuContext } from './interfaces'

export async function authHerokuTask() {
  const loggedInUser = await spawn('heroku auth:whoami')

  if (loggedInUser) {
    const { useUser } = await prompts({
      type: 'confirm',
      name: 'useUser',
      message: `You are currently logged in as ${loggedInUser}. Cool?`,
      initial: true,
    })

    if (!useUser) {
      await spawn('heroku logout')
      await spawnInteractive('heroku login')
    }
    // We are authed. Move on to next task
    return
  }
  throw new Error(HEROKU_ERRORS.NOT_LOGGED_IN)
}

export async function configureDeploymentTask(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  const {
    defaults,
    paths: { base: basePath },
  } = ctx
  const currentName = basePath.split('/').pop()
  if (defaults) {
    return {
      ...ctx,
      appName: currentName,
    }
  }
  const { appName } = await prompts([
    {
      type: 'text',
      name: 'appName',
      message: `Name your deployment app. [${currentName}]?`,
      initial: currentName,
    },
  ])
  return { ...ctx, appName }
}

export async function copyHerokuTemplatesTask(context: IHerokuContext) {
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'app.json'),
    path.join(context.paths.base, 'app.json')
  )
}

export async function createHerokuAppTask(ctx: IHerokuContext) {
  const {
    appName,
    paths: { base: basePath },
  } = ctx
  try {
    await spawn(`heroku apps:create ${appName} --manifest`, {
      cwd: basePath,
    })
  } catch (error: any) {
    if (error.message.includes('already taken')) {
      await _handleAppExistsError(ctx)
    } else {
      throw error
    }
  }
}

async function _handleAppExistsError(ctx: IHerokuContext) {
  const { appName } = ctx
  const { howToHandle } = await prompts({
    type: 'select',
    name: 'howToHandle',
    message: `App ${appName} already exists. What do you want to do?`,
    choices: [
      {
        title: 'Try to use existing app? (May corrupt current setup)',
        value: 'useExisting',
      },
      { title: 'Create new app with new name?', value: 'createNew' },
      { title: `Delete current and create ${appName}`, value: 'deleteCreate' },
    ],
  })
  if (howToHandle === 'useExisting') {
    return
  }
  if (howToHandle === 'createNew') {
    const nextAppName = await _getNextName(ctx)
    ctx.appName = nextAppName
    await createHerokuAppTask(ctx)
    return
  }
}

async function _getNextName(ctx: IHerokuContext): Promise<string> {
  const { appName } = ctx
  const { nextName } = await prompts({
    type: 'text',
    name: 'nextName',
    message: `What should the new app name be?`,
    initial: `${appName}-2`,
  })
  if (nextName === appName) {
    return _getNextName(ctx)
  }
  return nextName
}

export async function nukeHerokuAppTask(ctx: IHerokuContext) {
  if (ctx.nuke) {
    const { appName } = ctx
    await spawn(`heroku apps:destroy ${appName} --confirm ${appName}`)
    return
  }
  ctx.logger.error(
    'Somehow nuke was fired without the flag... might wanna check that out...'
  )
}
