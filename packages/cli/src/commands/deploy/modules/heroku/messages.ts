import { IHerokuContext, IPrereqs } from './interfaces'
import { yellow, red, blue, green } from './stdio'

export function createReadyMessage(ctx: IHerokuContext) {
  const { prereqs } = ctx

  if (!prereqs) {
    return `skipped checks`
  }

  const systemMessage = _systemStatusMessages(prereqs)
  const gitMessage = _gitStatusMessages(prereqs)
  const herokuMessage = _herokuStatusMessage(ctx)
  const projectMessages = _projectConfigMessages(prereqs)

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
}: IPrereqs) {
  const messages = []
  if (!isPackageJsonClean) {
    messages.push(yellow(`❌ package.json already has a build script`))
  }
  if (!isPrismaConfigured) {
    messages.push(yellow(`❌ Prisma is not configured for PostgreSQL`))
  }
  return messages
}

function _systemStatusMessages({ isDarwin }: IPrereqs) {
  if (!isDarwin) {
    return `❌ Only macOS is supported [${red('must exit')}]`
  }

  return ''
}

function _gitStatusMessages({ isGitClean, isGitRepo }: IPrereqs) {
  if (!isGitRepo) {
    return yellow(`❌ Project is not in a git repo`)
  }
  if (!isGitClean) {
    return yellow(`❌ Project has uncommitted changes`)
  }
  return ''
}

function _herokuStatusMessage(ctx: IHerokuContext) {
  return ctx.prereqs?.isUniqueName
    ? ''
    : `❌ [${blue(ctx.appName)}] is already taken`
}

export function createActionsMessages(ctx: IHerokuContext): string {
  const { prereqs } = ctx
  const list = []
  if (!prereqs?.isGitRepo) {
    list.push(green('＋ Create a git repo and commit current changes'))
  }
  if (!prereqs?.isGitClean) {
    list.push(green('＋ Commit current changes'))
  }
  if (!prereqs?.isUniqueName) {
    list.push(red(`⚠️  Delete existing app ${ctx.appName} and recreate`))
  }
  if (!prereqs?.isPackageJsonClean) {
    list.push(yellow('＋ Overwrite existing package.json build script'))
  } else {
    list.push(green('＋ Add package.json build script'))
  }
  if (!prereqs?.isPrismaConfigured) {
    list.push(
      red(
        '⚠️  Update DB to PostgreSQL. Make sure you understand the implications of this change'
      )
    )
  }
  list.push(green('＋ Add necessary templates'))
  list.push(green('＋ Configure heroku dynos. (You may adjust after)'))
  list.push(green('＋ Setup reverse proxy (NGINX) for API functions'))
  list.push(green('＋ Install and configure PM2 as node process manager'))
  list.push(green('＋ Add heroku remote and deploy!'))
  return list.join('\n')
}
