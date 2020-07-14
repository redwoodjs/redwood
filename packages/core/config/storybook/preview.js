const React = require('react')
const { addDecorator } = require('@storybook/react')

// The StorybookLoader is responsible for importing all the mock files and booting
// up the mock service workers.
const { StorybookLoader } = require('@redwoodjs/core/dist/storybook')

// Import the user's default CSS file
require('~__REDWOOD__USER_WEB_DEFAULT_CSS')

addDecorator(
  (storyFn, { id }) => {
    return React.createElement(StorybookLoader, { storyFn, id })
  }
)
