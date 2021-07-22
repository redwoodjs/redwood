const path = require('path')

module.exports = {
  testEnvironment: path.join(__dirname, './RedwoodApiJestEnv.js'),
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
}
