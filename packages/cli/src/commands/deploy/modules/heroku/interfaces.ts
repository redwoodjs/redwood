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
export interface IHerokuContext {
  appPath?: string
  defaults: boolean
  appName: string
  skipChecks?: boolean
  email?: string
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

export type HerokuApps = IHerokuApp[]
export interface IHerokuApp {
  acm: boolean
  archived_at: unknown
  buildpack_provided_description: string
  build_stack: {
    id: string
    name: string
  }
  created_at: string
  id: string
  git_url: string
  maintenance: boolean
  name: string
  owner: {
    email: string
    id: string
  }
  region: {
    id: string
    name: string
  }
  organization: unknown
  team: unknown
  space: unknown
  released_at: string
  repo_size: number
  slug_size: number
  stack: {
    id: string
    name: string
  }
  updated_at: string
  web_url: string
}

export interface ISpinnerAnimation {
  interval: number
  frames: string[]
}

export enum Attempt {
  SECOND,
  FIRST,
}
