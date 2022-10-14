/* eslint-env node */

// See these threads:
// - https://github.com/facebook/jest/issues/12770
// - https://github.com/microsoft/accessibility-insights-web/pull/5421#issuecomment-1109168149.
//
// TL;DR, we need to resolve the firebase packages to a CommonJS version. So we
// leverage jest's default resolver, but use `packageFilter` to process parsed
// `package.json` before resolution. In doing so, we only override how jest
// resolves the firebase packages.
module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      if (pkg.name === 'firebase') {
        pkg.exports['./auth'].default = pkg.exports['./auth'].node.require
      }

      if (['@firebase/auth', '@firebase/util'].includes(pkg.name)) {
        pkg.exports['.'].default = pkg.exports['.'].node.require
      }

      return pkg
    },
  })
}
