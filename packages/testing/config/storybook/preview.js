const React = require('react')

const { merge } = require('webpack-merge')

// The StorybookProvider is responsible for importing all the mock files,
// booting up the mock server workers, and mocking the router.
const {
  StorybookProvider,
} = require('@redwoodjs/testing/dist/StorybookProvider')

// Import the user's default CSS file
require('~__REDWOOD__USER_WEB_DEFAULT_CSS')

// The base config provides Redwood-specific integrations. User config values
// will be merged into this.
const baseConfig = {
  decorators: [
    (storyFn, { id }) =>
      React.createElement(StorybookProvider, { storyFn, id }),
  ],
}

const userConfig = require('~__REDWOOD__USER_STORYBOOK_PREVIEW_CONFIG')

/** @returns {import('webpack').Configuration} Webpack Configuration with storybook provider */
module.exports = merge(baseConfig, userConfig)
