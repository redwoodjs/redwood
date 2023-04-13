const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    excludeSpecPattern: ['**/codemods/*.js', '**/sharedTests.js'],
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: false,
    testIsolation: false,
  },
  // `runMode` is for `cypress run`, `openMode` is for `cypress open`.
  // Locally, we use open. But in CI, we use run.
  retries: {
    runMode: 5,
    openMode: 0,
  },
  defaultCommandTimeout: 240_000,
  execTimeout: 240_000,
  pageLoadTimeout: 240_000,
  requestTimeout: 240_000,
  taskTimeout: 240_000,
})
