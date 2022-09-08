import pluginTester from 'babel-plugin-tester'

import plugin from '../babel-plugin-redwood-test-db'

describe('babel plugin redwood import dir - graphql function', () => {
  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-test-db',
    tests: {
      'Adds the test global': {
        code: 'export const bazinga = 1',
        output:
          'globalThis.__RWJS_TEST_PRISMA_WAS_IMPORTED = true' +
          '\n' +
          'export const bazinga = 1',
      },
    },
  })
})
