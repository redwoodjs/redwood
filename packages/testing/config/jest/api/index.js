const path = require('path')

module.exports = {
  testEnvironment: path.join(__dirname, './RedwoodApiJestEnv.js'),
  displayName: {
    color: 'redBright',
    name: 'api',
  },
  setupFilesAfterEnv: [path.join(__dirname, './jest.setup.js')],
  moduleNameMapper: {
    // Ignore this special import routes for api testing
    // Needed because this is imported in @redwoodjs/testing, which now also used in the api side
    '~__REDWOOD__USER_ROUTES_FOR_MOCK': '@redwoodjs/testing/dist/fileMock.js',
  },
}
