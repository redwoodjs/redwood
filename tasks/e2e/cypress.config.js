const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'ao5sqb',
  retries: {
    runMode: 5,
    openMode: 0,
  },
  videoUploadOnPasses: false,
  video: false,
  execTimeout: 120000,
  pageLoadTimeout: 120000,
  defaultCommandTimeout: 120000,
  taskTimeout: 120000,
  requestTimeout: 120000,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    excludeSpecPattern: ['**/codemods/*.js', '**/sharedTests.js'],
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
