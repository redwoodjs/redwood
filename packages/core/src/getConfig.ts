import { TargetEnum } from '@redwoodjs/internal'

enum ConfigType {
  Jest = 'jest',
}

interface GetJestConfigParams {
  type: ConfigType.Jest
  target: TargetEnum
}

type GetConfigParams = GetJestConfigParams

/**
 * @deprecated This will be removed in v1.0.0, please make your `api/jest.config.js` and `web/jest.config.js` match the configuration files here: https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/jest.config.js, and https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/web/jest.config.js
 */
export function getConfig({ target }: GetConfigParams) {
  const side = target === 'node' ? 'api' : 'web'

  return require(`@redwoodjs/testing/configs/${side}/index.js`).default
}
