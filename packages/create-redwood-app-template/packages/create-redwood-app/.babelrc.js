const { presetEnvConfig, pluginModuleResolveAliasSrcDir } = require('../../scripts/babelConfigHelpers')

module.exports = {
  "extends": "../../babel.config.js",
  "presets": [
    presetEnvConfig("node"),
  ],
  "plugins": [
    pluginModuleResolveAliasSrcDir(),
  ],
}