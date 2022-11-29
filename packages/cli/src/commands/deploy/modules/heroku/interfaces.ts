import { ListrRendererFactory, ListrTaskWrapper } from 'listr2'
import yargs from 'yargs'

import { Paths } from '@redwoodjs/internal/dist/index'

import { Logger } from './logger'

export interface IYargs extends yargs.Argv {
  debug: boolean
  skipChecks: boolean
  defaults: boolean
  nuke: boolean
}

export interface IYargsOptions {
  [key: string]: yargs.Options
}

export interface IHerokuContext {
  logger: Logger
  paths: Paths
  appName?: string
  region?: string
  defaults: boolean
  nuke: boolean
}

export type IListrTask = ListrTaskWrapper<IHerokuContext, ListrRendererFactory>

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
