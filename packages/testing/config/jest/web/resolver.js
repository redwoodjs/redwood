// See these threads:
// - https://github.com/facebook/jest/issues/12770
// - https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      if (pkg.name === 'uuid') {
        delete pkg['exports']
        delete pkg['module']
      }
      return pkg
    },
  })
}
