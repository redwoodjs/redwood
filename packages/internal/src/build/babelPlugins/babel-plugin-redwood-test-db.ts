import type { PluginObj, types } from '@babel/core'
import template from '@babel/template'

/**
 * This plugin just adds a global variable to src/lib/db
 * So we can track whether the Prisma client has been importted.
 *
 * This allows us to skip teardown/disconnect steps in tests if the db isn't used
 * See other files:
 * packages/testing/config/jest/api/jest.setup.js - where we check the global we set
 * packages/testing/config/jest/api/apiBabelConfig.js - where this is used
 *
 */

export default function ({ types: _t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-test-db',
    visitor: {
      Program(p) {
        const prismaImport = template.ast`
         globalThis.__RWJS_TEST_PRISMA_WAS_IMPORTED = true;
         ` as types.Statement

        p.node.body.unshift(prismaImport)
      },
    },
  }
}
