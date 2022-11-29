import { binDoesExist, hasRosetta, systemInfo } from './command'

export const HEROKU_ERRORS = {
  NOT_OSX: 'Only OSX is supported',
  IS_WINDOWS: 'Windows is not supported at this time',
  NO_HOMEBREW: 'Homebrew is required to install Heroku',
  NO_ROSETTA: 'Rosetta is required to run Heroku on Apple Silicon',
  NOT_LOGGED_IN: 'Heroku authentication failed',
}

export async function checkSystemRequirements(): Promise<void> {
  if (process.platform === 'win32') {
    throw new Error(HEROKU_ERRORS.IS_WINDOWS)
  }

  const [os, arch] = await systemInfo()
  if (os !== 'Darwin') {
    throw new Error(HEROKU_ERRORS.NOT_OSX)
  }

  if (arch !== 'x86_64' && !(await hasRosetta())) {
    throw new Error(HEROKU_ERRORS.NO_ROSETTA)
  }

  await binDoesExist('heroku')
}
