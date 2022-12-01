import { getPaths } from '../../../../../lib'
import { IHerokuContext } from '../interfaces'

export const MOCK_HEROKU_CTX: IHerokuContext = {
  appName: 'captain-crunch',
  paths: getPaths(),
  defaults: false,
}
