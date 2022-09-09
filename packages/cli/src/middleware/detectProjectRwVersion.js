import { getInstalledRedwoodVersion } from '@redwoodjs/cli-helpers'

const detectRwVersion = (argv) => {
  if (!argv.rwVersion) {
    return {
      rwVersion: getInstalledRedwoodVersion(),
    }
  }
  return {}
}

export default detectRwVersion
