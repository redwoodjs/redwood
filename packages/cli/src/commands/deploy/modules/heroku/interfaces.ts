import { ListrContext, ListrRendererFactory, ListrTaskWrapper } from 'listr2'
import yargs from 'yargs'

import { Logger } from './logger'

export interface IYargs extends yargs.Argv {
  debug: boolean
  init: boolean
}

export interface IYargsOptions {
  [key: string]: yargs.Options
}

export interface IListrContext extends ListrContext {
  logger: Logger
}

export type IListrTask = ListrTaskWrapper<IListrContext, ListrRendererFactory>
