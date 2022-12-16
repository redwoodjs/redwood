import execa from 'execa'
import { ExecaReturnValue } from 'execa'

import { createLogger } from './stdio'

export const HEROKU_ERRORS = {
  MISSING_PROJECT_PATH: 'There was an issue finding the project path',
  HANDLE_DELETE: 'No app name provided to delete.',
  NO_SUPPORT: 'Only OSX is supported at this time',
  NO_HEROKU: 'Heroku CLI not found',
  IS_WINDOWS: 'Windows is not supported at this time',
  NOT_LOGGED_IN: 'User is not logged in to Heroku',
  APP_CREATE_FAIL: 'Could not create app. Correct any errors and try again',
  POSTGRES_NOT_CONFIGURED: 'Postgres is not configured for this app',
}

export interface IYargs {
  delete?: string
  appName: string
  defaults?: boolean
  skipChecks?: boolean
  debug?: boolean
}

export interface IHerokuContext extends IYargs {
  projectPath: string
  appUrl?: string
  email?: string
  prereqs: IPrereqs | null
  logger: ReturnType<typeof createLogger>
  spawn: BuiltSpawner
}

export interface IPrereqs {
  isDarwin?: boolean
  isX64?: boolean
  isGitRepo?: boolean
  isGitClean?: boolean
  isUniqueName?: boolean
  isPackageJsonClean?: boolean
  isPrismaConfigured?: boolean
  issues?: string[]
}

export interface ISpawnConfig extends execa.Options {
  debug?: boolean
  rawOutput?: boolean
}

export type BuiltSpawner = (
  cmd: string,
  opts?: ISpawnConfig
) => Promise<string | ExecaReturnValue>

export enum Attempt {
  SECOND,
  FIRST,
}
