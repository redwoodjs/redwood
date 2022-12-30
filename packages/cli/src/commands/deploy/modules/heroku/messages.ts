import boxen from 'boxen'

import { colors } from '../../../../lib'

import { type IHerokuContext, type IPrereqs } from './ctx'

export function createBoxen(message: string, title: string): string {
  return boxen(message, {
    title,
    margin: { top: 1, right: 0, bottom: 1, left: 0 },
    padding: { top: 0, right: 1, bottom: 0, left: 1 },
    borderStyle: 'round',
    backgroundColor: '#333',
    float: 'left',
  })
}

export function createReadyMessage(ctx: IHerokuContext): string {
  const { prereqs } = ctx

  if (ctx.defaults) {
    return `--defaults flag found... Goin for it!`
  }

  const systemMessage = _systemStatusMessages(prereqs || {})
  const gitMessage = _gitStatusMessages(prereqs || {})
  const herokuMessage = _herokuStatusMessage(ctx)
  const projectMessages = _projectConfigMessages(prereqs || {})
  const combined = [
    systemMessage,
    gitMessage,
    herokuMessage,
    ...projectMessages,
  ]
    .filter(Boolean)
    .join('\n')

  return combined
}

function _projectConfigMessages({
  isPackageJsonClean,
  isPrismaConfigured,
  hasHomeRoute,
}: IPrereqs): string[] {
  const messages = []
  if (!isPackageJsonClean) {
    messages.push(colors.yellow(`❌ package.json already has a build script`))
  }
  if (!isPrismaConfigured) {
    messages.push(colors.yellow(`❌ Prisma is not configured for PostgreSQL`))
  }
  if (!hasHomeRoute) {
    messages.push(colors.yellow(`❌ No root '/' route found for project`))
  }
  return messages
}

function _systemStatusMessages({ isDarwin }: IPrereqs): string {
  if (!isDarwin) {
    return `❌ Only macOS is supported [${colors.error('must exit')}]`
  }

  return ''
}

function _gitStatusMessages({ isGitClean, isGitRepo }: IPrereqs): string {
  if (!isGitRepo) {
    return colors.yellow(`❌ Project is not in a git repo`)
  }
  if (!isGitClean) {
    return colors.yellow(`❌ Project has uncommitted changes`)
  }
  return ''
}

function _herokuStatusMessage(ctx: IHerokuContext): string {
  return ctx.prereqs?.isUniqueName
    ? ''
    : `❌ [${colors.blue(ctx.appName)}] is already taken`
}

export function createActionsMessages(ctx: IHerokuContext): string {
  const { prereqs } = ctx
  const list = []
  if (!prereqs?.isGitRepo) {
    list.push(colors.green('＋ Create a git repo and commit current changes'))
  }
  if (!prereqs?.isGitClean) {
    list.push(colors.green('＋ Commit current changes'))
  }
  if (!prereqs?.isUniqueName) {
    list.push(
      colors.error(`⚠️  Delete existing app ${ctx.appName} and recreate`)
    )
  }
  if (!prereqs?.isPackageJsonClean) {
    list.push(
      colors.yellow('＋ Overwrite existing package.json build, start script')
    )
  } else {
    list.push(colors.green('＋ Add package.json build, start script'))
  }
  if (!prereqs?.isPrismaConfigured) {
    list.push(
      colors.error(
        '⚠️  Update DB to PostgreSQL. Make sure you understand the implications of this change'
      )
    )
  }

  if (!prereqs?.hasHomeRoute) {
    list.push(
      colors.error(`⚠️  Generate a default home route, '/', for project`)
    )
  }
  list.push(colors.green('＋ Add necessary templates'))
  list.push(colors.green('＋ Configure heroku dynos. (You may adjust after)'))
  list.push(colors.green('＋ Setup reverse proxy (NGINX) for API functions'))
  list.push(
    colors.green('＋ Install and configure PM2 as node process manager')
  )
  list.push(colors.green('＋ Add heroku remote and deploy!'))
  return list.join('\n')
}
