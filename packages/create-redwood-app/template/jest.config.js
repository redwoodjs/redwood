// This the monorepo jest config
// Each side has their configuration setup e.g. in `web/jest.config.js`

// Note that jest configs aren't merged!

module.exports = {
  rootDir: '.',
  projects: ['<rootDir>/{*,!(node_modules)/**/}/jest.config.js'],
}
