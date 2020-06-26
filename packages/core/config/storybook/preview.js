const path = require('path')

const React = require('react')
const { configure, addDecorator } = require('@storybook/react')
const { getPaths } = require('@redwoodjs/internal')

const { providersDecorator } = require('@redwoodjs/core')


require(path.join(getPaths().web.base, 'index.css'))

addDecorator(providersDecorator)
