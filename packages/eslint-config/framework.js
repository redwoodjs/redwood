const path = require('path')

const findUp = require('findup-sync')

const findBabelConfig = (cwd = process.cwd()) => {
  const configPath = findUp('babel.config.js', { cwd })
  if (!configPath) {
    throw new Error(`Eslint-parser could not find a "babel.config.js" file`)
  }
  return configPath
}

// Just configure the babel options
// The framework is configured with babel.config.js
// While projects are configured programatically from rwjs/internal
module.exports = {
  extends: path.join(__dirname, 'shared.js'),
  parserOptions: {
    babelOptions: {
      configFile: findBabelConfig(),
    },
  },
}
