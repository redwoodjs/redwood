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

export function getConfig(opts: GetConfigParams) {
  const createConfig = require(`@redwoodjs/core/dist/configs/${opts.target}/${opts.type}.createConfig.js`)
    .default

  return createConfig(opts)
}
