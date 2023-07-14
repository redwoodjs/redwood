import boxen from 'boxen'
import semver from 'semver'

import { getConfig } from '@redwoodjs/project-config'

export async function enforceNodeVersionConfig() {
  // only check if a node version is specified in redwood.toml
  const config = getConfig()
  if (config.node.version !== undefined) {
    // get current node version, coerce to semver to remove leading 'v'
    const currentVersion = semver.coerce(process.version)

    // ensure config value is valid, either a valid semver or semver range
    const requiredVersion = config.node.version
    if (
      semver.valid(requiredVersion) === null &&
      semver.validRange(requiredVersion) === null
    ) {
      console.error(
        boxen(
          `Node version '${requiredVersion}' is not valid in your redwood.toml`,
          { padding: 1, borderColor: 'red', title: 'Node version enforcement' }
        )
      )
      process.exit(1)
    }

    // ensure current version satisfies required version
    if (!semver.satisfies(currentVersion, requiredVersion)) {
      console.error(
        boxen(
          `Node version '${currentVersion}' is not allowed by your redwood.toml, it requires '${requiredVersion}'`,
          { padding: 1, borderColor: 'red', title: 'Node version enforcement' }
        )
      )
      process.exit(1)
    }
  }
}
