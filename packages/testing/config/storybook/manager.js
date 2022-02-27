const { merge } = require('webpack-merge')

const baseConfig = {}

// Load the user's `manager.js`-equivalent using the alias setup in `./main.js`
const userConfig = require('~__REDWOOD__USER_STORYBOOK_MANAGER_CONFIG')

/** @returns {import('webpack').Configuration} Webpack Configuration with storybook provider */
module.exports = merge(baseConfig, userConfig)
