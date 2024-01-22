const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    excludeSpecPattern: ['**/codemods/*.js', '**/sharedTests.js'],

    testIsolation: false,

    setupNodeEvents(on, config) {
      require('cypress-fail-fast/plugin')(on, config)
      return config
    },
  },

  // `runMode` is for `cypress run`, `openMode` is for `cypress open`.
  // Locally, we use open. But in CI, we use run.
  retries: {
    runMode: 3,
    openMode: 1,
  },

  defaultCommandTimeout: 12_0000,
  execTimeout: 12_0000,
  pageLoadTimeout: 12_0000,
  requestTimeout: 12_0000,
  taskTimeout: 12_0000,
})
