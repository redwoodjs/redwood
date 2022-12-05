import { Heroku } from './api'
import { IHerokuContext } from './interfaces'
import { spawn } from './stdio'

export async function pushStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  const isInGit = await spawn('git rev-parse --is-inside-git-dir')
  const isGitClean = await spawn('git status --short')
  if (!isInGit || isGitClean) {
    throw new Error('You must have a git repository with uncommitted changes.')
  }
  await Heroku.push()
  return ctx
}
