// @WARN: This export is going to cause memory problems in the CLI.
// We need to split this into smaller packages, or use export aliasing (like in packages/testing/cache)

export * from './lib'
export * from './lib/colors'
export * from './lib/paths'
export * from './lib/project'
export * from './lib/version'
export * from './auth/setupHelpers'

export * from './lib/installHelpers'

export * from './telemetry/index'
