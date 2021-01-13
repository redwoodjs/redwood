const { getConfig } = require('@redwoodjs/core')

const config = getConfig({ type: 'jest', target: 'browser' })
config.displayName.name = 'web'

module.exports = config
