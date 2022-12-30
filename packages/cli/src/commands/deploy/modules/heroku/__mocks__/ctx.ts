import { DEFAULT_PREREQS, type IHerokuContext, type IYargs } from '../ctx'
import { PREDEPLOY_CHOICES } from '../predeploy'
import { createLogger } from '../stdio'

export const MOCK_YARGS: IYargs = {
  defaults: false,
  destroy: '',
  debug: false,
  appName: 'captain-crunch',
}

export const MOCK_HEROKU_CTX: IHerokuContext = {
  ...MOCK_YARGS,
  projectPath: 'mock/project/path',
  logger: createLogger(),
  appUrl: 'http://heroku.mock.url',
  spawn: jest.fn(),
  predeploySteps: PREDEPLOY_CHOICES,
  prereqs: DEFAULT_PREREQS,
}
