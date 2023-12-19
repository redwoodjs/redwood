import semver from 'semver'

export function checkNodeVersion() {
  const pVersion = process.version
  const pVersionC = semver.clean(pVersion)
  const LOWER_BOUND = 'v20.0.0'
  const LOWER_BOUND_C = semver.clean(LOWER_BOUND)

  if (semver.gt(pVersionC, LOWER_BOUND_C)) {
    return
  }

  console.warn(
    [
      `👷 Heads up: Your Node.js version is ${pVersion}, but Redwood requires >=${LOWER_BOUND}`,
      'Upgrade your Node.js version using `nvm` or a similar tool. See https://redwoodjs.com/docs/how-to/using-nvm.',
      '',
    ].join('\n')
  )
}
