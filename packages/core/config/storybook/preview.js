const React = require('react')
const { addDecorator } = require('@storybook/react')
require('~__REDWOOD__USER_WEB_DEFAULT_CSS')

// ** NOTE ** HMR doesn't work if you don't import the MockProviders directly.
const { MockProviders } = require('@redwoodjs/testing/dist/MockProviders')

addDecorator((storyFn) => React.createElement(MockProviders, null, storyFn()))
