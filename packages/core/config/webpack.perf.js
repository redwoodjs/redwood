const BabelTimingPlugin = require('babel-timing/webpack/plugin')

const webpackConfig = require('./webpack.common')

// https://github.com/toomuchdesign/babel-timing
/** @type {import('webpack').Configuration}  Configuration with webpack bundler analyzer config */

const config = webpackConfig('production')

config.plugins.push(
  new BabelTimingPlugin({
    output: 'console',
    expandPackages: true,
    aggregateBy: 'plugins',
  }),
)

/** Note: Only matches regex */
const indexOfRulesTest = (regex) => {
  return config.module.rules[0].oneOf.findIndex((r) => {
    return r.test.toString() === regex.toString()
  })
}

const babel = indexOfRulesTest(/\.(js|mjs|jsx|ts|tsx)$/)
config.module.rules[0].oneOf[babel].use[0].options.customize = require.resolve(
  'babel-timing/webpack/babel-loader-customize',
)

module.exports = config
