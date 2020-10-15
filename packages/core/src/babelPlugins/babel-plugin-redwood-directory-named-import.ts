import { resolveFile, ensurePosixPath } from '@redwoodjs/internal'
import path from 'path'

import type { PluginObj, types } from '@babel/core'

const getNewPath = (value: string, filename: string) => {
  const dirname = path.dirname(value)
  const basename = path.basename(value)

  const indexImportPath = [dirname, basename, 'index'].join('/')

  const indexImportPathResolved = resolveFile(
    path.join(path.dirname(filename), indexImportPath)
  )

  if (indexImportPathResolved) {
    // If babel can resolve this path with the index file
    return indexImportPathResolved
  } else {
    // If there isn't a index file
    const newImportPath = [dirname, basename, basename].join('/')

    return resolveFile(path.join(path.dirname(filename), newImportPath))
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

        const newPath = getNewPath(value, <string>filename)
        if (!newPath) return
        const newSource = t.stringLiteral(ensurePosixPath(newPath))
        p.node.source = newSource
      },

      ExportDeclaration(p, state) {
        // @ts-expect-error - TypeDef must be outdated.
        if (!p?.node?.source) {
          return
        }

        // @ts-expect-error - TypeDef must be outdated.
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

        const newPath = getNewPath(value, <string>filename)
        if (!newPath) return
        const newSource = t.stringLiteral(ensurePosixPath(newPath))
        // @ts-expect-error - TypeDef must be outdated.
        p.node.source = newSource
      },
    },
  }
}
