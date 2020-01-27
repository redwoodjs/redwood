const { presetEnvConfig, pluginModuleResolveAliasSrcDir } = require('../../scripts/babelConfigHelpers')

module.exports = {
  "extends": "../../babel.config.js",
  "presets": [
    presetEnvConfig("browsers"),
  ],
  "plugins": [
    pluginModuleResolveAliasSrcDir(),
  ],
}