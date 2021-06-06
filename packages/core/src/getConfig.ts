import { TargetEnum } from '@redwoodjs/internal'

// TODO: Add more types like eslint, babel, etc?
// TODO: Move somewhere else
enum ConfigType {
  Jest = 'jest',
}

interface GetJestConfigParams {
  type: ConfigType.Jest
  target: TargetEnum
}

type GetConfigParams = GetJestConfigParams

// TODO: We need to move this to "testing" instead, in the meantime we'll just make it work.
/**
 * @deprecated This will be removed in v1.0.0, please use ""
 */
export function getConfig({ target }: GetConfigParams) {
  const side = target === 'node' ? 'api' : 'web'

  return require(`@redwoodjs/testing/configs/${side}/index.js`).default
}
