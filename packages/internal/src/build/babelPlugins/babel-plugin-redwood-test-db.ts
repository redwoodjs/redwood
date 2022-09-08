import type { PluginObj, types } from '@babel/core'
import template from '@babel/template'

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
