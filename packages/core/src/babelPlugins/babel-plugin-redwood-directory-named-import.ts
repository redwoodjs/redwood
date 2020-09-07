import path from 'path'

import type { PluginObj, types } from '@babel/core'

import { resolveFile } from '@redwoodjs/internal'

const getNewPath = (value, filename) => {
  const dirname = path.dirname(value)
  const basename = path.basename(value)

  const newImportPath = [dirname, basename, basename].join('/')

  try {
    require.resolve(path.resolve(path.dirname(filename), newImportPath))
    return newImportPath
  } catch (e) {
    return null
  }
}

export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    visitor: {
      ImportDeclaration(p, state) {
        const { value } = p.node.source // import xyz from <value>
        const { filename } = state.file.opts // the file where this import statement resides

        // We only operate in "userland," skip node_modules.
        if (filename?.includes('/node_modules/')) return
        // We only need this plugin in the module could not be found.
        try {
          require.resolve(value)
          return // ABORT
        } catch {
          // CONTINUE...
        }

        const newPath = getNewPath(value, filename)
        if (!newPath) return
        const newSource = t.stringLiteral(value.replace(value, newPath))
        p.node.source = newSource
      },

      ExportDeclaration(p, state) {
        if (!p?.node?.source) {
          return
        }

        const { value } = p.node.source
        const { filename } = state.file.opts

        // We only operate in "userland," skip node_modules.
        if (filename?.includes('/node_modules/')) return
        // We only need this plugin in the module could not be found.
        try {
          require.resolve(value)
          return // ABORT
        } catch {
          // CONTINUE...
        }

        const newPath = getNewPath(value, filename)
        if (!newPath) return
        const newSource = t.stringLiteral(value.replace(value, newPath))
        p.node.source = newSource
      },
    },
  }
}
