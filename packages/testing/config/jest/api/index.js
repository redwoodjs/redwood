const path = require('path')

module.exports = {
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
}
