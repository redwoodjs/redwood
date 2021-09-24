jest.autoMockOff()
import { defineTest } from 'jscodeshift/dist/testUtils'

defineTest(__dirname, 'graphqlFunctionImports', null, 'graphql', {
  parser: 'ts',
})
