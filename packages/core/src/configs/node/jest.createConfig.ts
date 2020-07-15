const path = require('path')

export default function getNodeJestConfig() {
  return {
    displayName: {
      color: 'redBright',

      // TODO: Detect which side this is and name it that instead
      name: 'node',
    },

    resolver: 'jest-directory-named-resolver',
    setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.js')],
  }
}
