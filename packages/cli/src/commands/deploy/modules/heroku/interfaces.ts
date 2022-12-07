import { createLogger } from './stdio'

export const HEROKU_ERRORS = {
  MISSING_PROJECT_PATH: 'There was an issue finding the project path',
  HANDLE_DELETE: 'No app name provided to delete.',
  // NO_SUPPORT: 'Only OSX is supported at this time',
  // NO_HEROKU: 'Heroku CLI not found',
  // IS_WINDOWS: 'Windows is not supported at this time',
  // NO_HOMEBREW: 'Homebrew is required to install Heroku',
  // NO_ROSETTA: 'Rosetta is required to run Heroku on Apple Silicon',
  NOT_LOGGED_IN: 'User is not logged in to Heroku',
  // APP_EXISTS: 'App already exists',
  // NEEDS_VERIFY: 'Heroku needs to verify your account or payment info',
  APP_CREATE_FAIL: 'Could not create app. Correct any errors and try again',
  // UNKNOWN_ERROR: 'An unknown error occurred',
  // NO_POSTGRES: 'Postgres is not configured for this app',
}

export const COMMAND_RESPONSES = {
  whoami: 'not logged in',
  create: 'already taken',
  info: '',
  listApps: '',
  destroy: '',
}

export interface IHerokuContext {
  projectPath: string
  defaults?: boolean
  delete?: string
  appName: string
  skipChecks?: boolean
  email?: string
  debug: boolean
  logger: ReturnType<typeof createLogger>
  appUrl?: string
}

export enum Attempt {
  SECOND,
  FIRST,
}
