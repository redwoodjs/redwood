const {
  getApiSideDefaultBabelConfig,
  getApiSideBabelPresets,
  getApiSideBabelPlugins,
} = require('@redwoodjs/internal')

// Since configFile and babelrc is already passed a level up, cleaning up these keys here.
// Ref: packages/testing/config/jest/api/index.js
const {
  configFile: _c,
  babelrc: _b,
  ...defaultBabelConfig
} = getApiSideDefaultBabelConfig()

module.exports = {
  ...defaultBabelConfig,
  plugins: getApiSideBabelPlugins({ forJest: true }),
  presets: getApiSideBabelPresets({
    presetEnv: true, // jest needs code transpiled
  }),
}
