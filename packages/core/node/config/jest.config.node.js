// used by cli `rw test` command
// note: roodDir is a workaround for jest working directory weirdness

const path = require('path')

module.exports = function createNodeConfig({ displayName, rootDir }) {
  return {
    resolver: 'jest-directory-named-resolver',
    rootDir,
    displayName,
    setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.node.js')],
  }
}
