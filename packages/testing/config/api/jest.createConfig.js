/* eslint-env node, jest */
const path = require('path')

export const setupFilesAfterEnv = [path.resolve(__dirname, './jest.setup.js')]

export default function getNodeJestConfig(options) {
  return {
    displayName: {
      color: 'redBright',
      name: 'api',
    },
    setupFilesAfterEnv,
    ...options,
  }
}
