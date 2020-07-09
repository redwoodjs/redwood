import { getBrowserJestConfig } from './browser/config/getBrowserJestConfig'
import { getNodeJestConfig } from './node/config/getNodeJestConfig'

// TODO: Add more types like eslint, babel, etc?
// TODO: Move somewhere else
enum ConfigType {
  Jest = 'jest',
}

// TODO: Add more build targets
// TODO: Move somewhere else
enum BuildTarget {
  Browser = 'browser',
  Node = 'node',
}

interface GetJestConfigParams {
  type: ConfigType.Jest
  target: BuildTarget
}

const jestConfigMap = {
  [BuildTarget.Browser]: getBrowserJestConfig,
  [BuildTarget.Node]: getNodeJestConfig,
}

function getJestConfig({ target }: GetJestConfigParams) {
  return jestConfigMap[target]()
}

const configMap = {
  jest: getJestConfig,
}

type GetConfigParams = GetJestConfigParams

export function getConfig(opts: GetConfigParams) {
  return configMap[opts.type](opts)
}
