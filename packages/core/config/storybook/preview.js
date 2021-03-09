const React = require('react')

const { addDecorator } = require('@storybook/react')

// The StorybookProvider is responsible for importing all the mock files,
// booting up the mock server workers, and mocking the router.
const {
  StorybookProvider,
} = require('@redwoodjs/core/dist/storybook/StorybookProvider')

// Import the user's default CSS file
require('~__REDWOOD__USER_WEB_DEFAULT_CSS')

addDecorator((storyFn, { id }) => {
  return React.createElement(StorybookProvider, { storyFn, id })
})
