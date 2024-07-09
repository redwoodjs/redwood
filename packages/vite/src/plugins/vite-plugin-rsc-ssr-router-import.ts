import path from 'node:path'

import bgen from '@babel/generator'
const { default: generate } = bgen
import { parse as babelParse } from '@babel/parser/index.cjs'
import btrav from '@babel/traverse'
const { default: traverse } = btrav
import * as t from '@babel/types'
import type { Plugin } from 'vite'
import { normalizePath } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

/**
 * Transform `import { Router } from '@redwoodjs/vite/Router'` to
 * `import { Router } from '@redwoodjs/vite/SsrRouter'`
 */
export function rscSsrRouterImport(): Plugin {
  // Vite IDs are always normalized and so we avoid windows path issues
  // by normalizing the path here.
  const routesFileId = normalizePath(getPaths().web.routes)

  return {
    name: 'rsc-ssr-router-import',
    transform: async function (code, id) {
      // We only care about the routes file
      if (id !== routesFileId) {
        return null
      }

      // Parse the code as AST
      const ext = path.extname(id)
      const plugins: any[] = []

      if (ext === '.jsx') {
        plugins.push('jsx')
      }

      const ast = babelParse(code, {
        sourceType: 'unambiguous',
        plugins,
      })

      traverse(ast, {
        ImportDeclaration(path) {
          const source = path.node.source.value
          if (source === '@redwoodjs/vite/Router') {
            path.node.source = t.stringLiteral('@redwoodjs/vite/SsrRouter')
          }
        },
      })
      return generate(ast).code
    },
  }
}
