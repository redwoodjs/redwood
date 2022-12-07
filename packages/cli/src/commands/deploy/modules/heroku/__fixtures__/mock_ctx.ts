import { IHerokuContext } from '../interfaces'
import { createLogger } from '../stdio'

export const MOCK_HEROKU_CTX: IHerokuContext = {
  projectPath: 'mock/project/path',
  defaults: false,
  delete: undefined,
  appName: 'captain-crunch',
  skipChecks: false,
  debug: false,
  logger: createLogger(),
  appUrl: 'http://heroku.mock.url',
}
