const React = require('react')
const { addDecorator } = require('@storybook/react')

// Import the user's default CSS file
require('~__REDWOOD__USER_WEB_DEFAULT_CSS')

// The StorybookLoader is responsible for importing the mock files and booting
// up the mock service workers.
const { default: StorybookLoader } = require('@redwoodjs/core/dist/StorybookLoader')

addDecorator((storyFn) => React.createElement(StorybookLoader, { storyFn }))
