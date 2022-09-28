// See these threads:
// - https://github.com/facebook/jest/issues/12770
// - https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149.
//
// TL;DR, we need to resolve uuid to a CommonJS version. So we leverage jest's default resolver,
// but use `packageFilter` to process parsed `package.json` before resolution. In doing so,
// we only override how jest resolves uuid.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      if (pkg.name === 'firebase/auth') {
        delete pkg['browser']
        delete pkg['module']
        console.log('packageFilter', pkg)
      }

      return pkg
    },
  })
}
