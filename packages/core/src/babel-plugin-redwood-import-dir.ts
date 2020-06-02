import path from 'path'

import glob from 'glob'
import type { PluginObj, types } from '@babel/core'

/**
 * This babel plugin will search for import statements that include a star "*",
 * the source part of the statement is a glob, the files that are matched are imported,
 * and appended to an object.
 *
 * @example:
 * Given a directory "src/services" that contains "a.js" and "b.ts", will produce
 * the following results
 * ```
 * import services from 'src/services/*.{js,ts}'
 * console.log(services)
 * // services.a = require('src/services/a.js')
 * // services.b = require('src/services/b.ts')
 * ```
 *
 * @todo We **do not** support nested directories.
 * @todo Generate ambient declerations for TypeScript of imported files.
 */
export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-import-dir',
    visitor: {
      ImportDeclaration(p, state: { file?: any }) {
        // This code will only run when we find an import statement that includes a "*".
        if (!p.node.source.value.includes('*')) {
          return
        }

        const nodes = []

        // import <node.specifiers[0].local.name> from <node.source.value>
        // + let importName = {}
        const importName = p.node.specifiers[0].local.name
        nodes.push(
          t.variableDeclaration('let', [
            t.variableDeclarator(
              t.identifier(importName),
              t.objectExpression([])
            ),
          ])
        )

        const cwd = path.dirname(state.file.opts.filename)
        const dirFiles = glob.sync(p.node.source.value, { cwd })
        for (const filePath of dirFiles) {
          const fileName = path.basename(filePath).split('.')[0]
          // + import * as <importName>_<fileName> from <filePath>
          nodes.push(
            t.importDeclaration(
              [
                t.importNamespaceSpecifier(
                  t.identifier(importName + '_' + fileName)
                ),
              ],
              t.stringLiteral(filePath)
            )
          )

          // + <importName>.<fileName> = <importName_fileName>
          nodes.push(
            t.expressionStatement(
              t.assignmentExpression(
                '=',
                t.memberExpression(
                  t.identifier(importName),
                  t.identifier(fileName)
                ),
                t.identifier(importName + '_' + fileName)
              )
            )
          )
        }

        for (const node of nodes) {
          p.insertBefore(node)
        }
        // - import importName from "dirPath"
        p.remove()
      },
    },
  }
}
