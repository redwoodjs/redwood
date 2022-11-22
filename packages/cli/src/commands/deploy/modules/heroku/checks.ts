import { binDoesExist, executeCommand } from './command'

export const HEROKU_ERRORS = {
  NOT_OSX: 'Only OSX is supported',
  NO_HOMEBREW: 'Homebrew is required to install Heroku',
}

export async function checkSystemRequirements(): Promise<void> {
  await doesHaveDarwin()
}

export async function doesHaveHeroku(): Promise<boolean> {
  try {
    if (await binDoesExist('heroku')) {
      return true
    }
    return false
  } catch (err) {
    return false
  }
}

export async function doesHaveDarwin(): Promise<boolean> {
  const { stdout } = await executeCommand('uname')
  if (stdout === 'Darwin') {
    return true
  }
  throw new Error(HEROKU_ERRORS.NOT_OSX)
}

export async function doesHaveHomebrew(): Promise<boolean> {
  if (!(await binDoesExist('brew'))) {
    throw new Error(HEROKU_ERRORS.NO_HOMEBREW)
  }
  return true
}
