const path = require('path')
const React = require('react')
const { addDecorator } = require('@storybook/react')
const { providersDecorator } = require('@redwoodjs/core')

addDecorator(providersDecorator)
