jest.autoMockOff()
import { defineTest } from 'jscodeshift/dist/testUtils'

defineTest(__dirname, 'addPrismaCreateToScenarios', { parser: 'tsx' }, 'simple')

// To test TS files
// https://github.com/facebook/jscodeshift/blob/main/src/testUtils.js#L87
defineTest(__dirname, 'addPrismaCreateToScenarios', null, 'realExample', {
  parser: 'ts',
})
