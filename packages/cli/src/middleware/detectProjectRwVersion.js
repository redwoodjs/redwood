import { getInstalledRedwoodVersion } from '../lib/index.js'

const detectRwVersion = (argv) => {
  if (!argv.rwVersion) {
    return {
      rwVersion: getInstalledRedwoodVersion(),
    }
  }
  return {}
}

export default detectRwVersion
