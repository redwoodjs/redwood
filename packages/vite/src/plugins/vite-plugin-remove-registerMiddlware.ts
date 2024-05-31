import * as babel from '@babel/core'
import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { createFilter } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

const plugin = () => ({
  visitor: {
    VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
      // @ts-expect-error fggg
      if (path.node.id.name === 'registerMiddleware') {
        path.remove()
      }
    },
  },
})

export default function removeRegisterMiddleware() {
  const filter = createFilter(getPaths().web.entryServer, 'node_modules/**')

  return {
    name: 'remove-register-middleware',
    transform: async (code: string, id: string) => {
      if (filter(id)) {
        const result = await babel.transformAsync(code, {
          plugins: [plugin],
        })
        return result?.code
      }

      return null
    },
  }
}
