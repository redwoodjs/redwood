import { spawnShell } from './command'
import { IListrContext, IListrTask } from './interfaces'

export const HEROKU_ERRORS = {
  NOT_OSX: 'Only OSX is supported',
  NO_HOMEBREW: 'Homebrew is required to install Heroku',
}

export async function checkSystemRequirements(
  ctx: IListrContext,
  task: IListrTask
): Promise<void> {
  await doesHaveDarwin(ctx, task)
}

export async function doesHaveDarwin(
  _ctx: IListrContext,
  task: IListrTask
): Promise<boolean> {
  const { stdout } = await spawnShell('uname')
  if (stdout === 'Darwin') {
    task.output = 'OSX detected'
    return true
  }
  throw new Error(HEROKU_ERRORS.NOT_OSX)
}
