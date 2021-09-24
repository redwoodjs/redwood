jest.autoMockOff()

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Not inside tsconfig rootdir
import { defineTest } from 'jscodeshift/dist/testUtils'

defineTest(__dirname, 'addPrismaCreateToScenarios', { parser: 'tsx' }, 'simple')

// To test TS files
// https://github.com/facebook/jscodeshift/blob/main/src/testUtils.js#L87
defineTest(__dirname, 'addPrismaCreateToScenarios', null, 'realExample', {
  parser: 'ts',
})
