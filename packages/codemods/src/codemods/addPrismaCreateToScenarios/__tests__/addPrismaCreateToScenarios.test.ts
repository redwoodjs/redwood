jest.autoMockOff()
const defineTest = require('jscodeshift/dist/testUtils').defineTest
defineTest(__dirname, 'addPrismaCreateToScenarios')

// @TODO cannot test ts files
// defineTest(__dirname, 'realExample')
