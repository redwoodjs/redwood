const path = require('path')

export function getNodeJestConfig() {
  return {
    displayName: {
      color: 'redBright',
      name: 'node',
    },

    resolver: 'jest-directory-named-resolver',
    setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.node.js')],
  }
}
