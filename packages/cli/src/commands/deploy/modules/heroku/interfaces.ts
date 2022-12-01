import yargs from 'yargs'

import { Paths } from '@redwoodjs/internal/dist/index'

export const HEROKU_ERRORS = {
  NO_SUPPORT: 'Only OSX is supported at this time',
  NO_HEROKU: 'Heroku CLI not found',
  IS_WINDOWS: 'Windows is not supported at this time',
  NO_HOMEBREW: 'Homebrew is required to install Heroku',
  NO_ROSETTA: 'Rosetta is required to run Heroku on Apple Silicon',
  NOT_LOGGED_IN: 'User is not logged in to Heroku',
  APP_EXISTS: 'App already exists',
  NEEDS_VERIFY: 'Heroku needs to verify your account or payment info',
  APP_CREATE_FAIL: 'Could not create app. Correct any errors and try again',
  UNKNOWN_ERROR: 'An unknown error occurred',
}

export interface IYargs extends yargs.Argv {
  defaults: boolean
  app: string
}

export interface IYargsOptions {
  [key: string]: yargs.Options
}

export interface IHerokuContext {
  paths: Paths
  appName: string
  defaults: boolean
}

export type Regions = IHerokuRegion[]
export interface IHerokuRegion {
  country: string
  created_at: string
  description: string
  id: string
  locale: string
  name: string
  private_capable: boolean
  provider: {
    name: string
    region: string
  }
  updated_at: string
}

export interface ISpawnResult {
  stdout?: string
  stderr?: string
  exitCode: number
  message?: string
}

export interface ISpinnerAnimation {
  interval: number
  frames: string[]
}
