const path = require('path')

export default function getNodeJestConfig() {
  return {
    displayName: {
      color: 'redBright',
      name: 'api',
    },

    resolver: 'jest-directory-named-resolver',
    setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.js')],
  }
}
