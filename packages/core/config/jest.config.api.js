// used by cli `rw test` command
// note: roodDir is a workaround for jest working directory weirdness

const path = require('path')

module.exports = {
  resolver: 'jest-directory-named-resolver',
  rootDir: process.cwd(),
  setupFilesAfterEnv: [path.resolve(__dirname, './jest.setup.api.js')],
}
