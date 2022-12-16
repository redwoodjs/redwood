import type { IHerokuContext, IYargs } from '../interfaces'
import { createLogger } from '../stdio'

export const MOCK_YARGS: IYargs = {
  defaults: false,
  delete: undefined,
  skipChecks: false,
  debug: false,
  appName: 'captain-crunch',
}

export const MOCK_HEROKU_CTX: IHerokuContext = {
  ...MOCK_YARGS,
  projectPath: 'mock/project/path',
  logger: createLogger(),
  appUrl: 'http://heroku.mock.url',
  prereqs: null,
  spawn: jest.fn(),
}
