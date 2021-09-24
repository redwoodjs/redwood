jest.autoMockOff()
import { defineTest } from 'jscodeshift/dist/testUtils'

// TS and JS are equivalent in this case
defineTest(__dirname, 'graphqlFunctionImports', null, 'graphql', {
  parser: 'ts',
})
