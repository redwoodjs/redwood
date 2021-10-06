import path from 'path'

// TODO: Figure out why Wallaby doesn't work with a normal import.
import type { PluginObj, types } from '@babel/core'

// TODO: Circular TS dependency
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getProject, URL_file } from '@redwoodjs/structure'

import { getBaseDirFromFile } from '../../paths'

export default function ({ types: t }: { types: typeof types }): PluginObj {
  let nodesToRemove: any[] = []
  let nodesToInsert: any[] = []

  return {
    name: 'babel-plugin-redwood-mock-cell-data',

    visitor: {
      Program: {
        enter() {
          nodesToRemove = []
          nodesToInsert = []
        },
        exit(p) {
          for (const n of nodesToRemove) {
            n.remove()
          }
          // Insert at the top of the file
          p.node.body.unshift(...nodesToInsert)
        },
      },
      ExportNamedDeclaration(p, state: { file?: any }) {
        // This converts a standard export into a "mockGraphQLQuery" by automatically:
        // Determining the query operation name for `QUERY` and,
        // wrapping the exported data in `afterQuery`
        //
        // Rules:
        // 1. Must be a *.mock.[ts,js] file.
        // 2. That has a named export called "standard".
        // 3. That are adjacent to a Cell.
        // 4. The Cell has a operation name for the QUERY export.

        const d = p.node.declaration
        if (d?.type !== 'VariableDeclaration') {
          return
        }

        const vd = d.declarations[0] as types.VariableDeclarator
        const id = vd.id as types.Identifier
        const exportName = id?.name
        if (exportName !== 'standard') {
          return
        }

        const init = vd?.init
        if (!init) {
          return
        }

        // Find the model of the Cell that is in the same directory.
        const filename = state.file.opts.filename
        const dir = URL_file(path.dirname(state.file.opts.filename))
        const project = getProject(getBaseDirFromFile(filename))
        const cell = project.cells.find((x: any) => x.uri.startsWith(dir))

        if (!cell || !cell?.filePath) {
          return
        }

        if (!cell.queryOperationName) {
          return
        }

        // export const standard
        const exportStandard = (
          ex: types.CallExpression | types.ArrowFunctionExpression
        ) =>
          t.exportNamedDeclaration(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier('standard'), ex),
            ])
          )

        // mockGraphQLQuery(<operationName>, <data>)
        const mockGraphQLCall = t.callExpression(
          t.identifier('mockGraphQLQuery'),
          [t.stringLiteral(cell.queryOperationName), init]
        )

        // Delete original "export const standard"
        nodesToRemove = [...nodesToRemove, p]

        // + import { afterQuery } from './${cellFileName}'
        // + export const standard = () => afterQuery(...)
        if (cell.exportedSymbols.has('afterQuery')) {
          const importAfterQuery = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier('afterQuery'),
                t.identifier('afterQuery')
              ),
            ],
            t.stringLiteral(`./${path.basename(cell.filePath)}`)
          )

          nodesToInsert = [
            ...nodesToInsert,
            importAfterQuery,
            exportStandard(
              t.arrowFunctionExpression(
                [],
                t.callExpression(t.identifier('afterQuery'), [
                  t.callExpression(mockGraphQLCall, []),
                ])
              )
            ),
          ]
        } else {
          // + export const standard = mo
          nodesToInsert = [...nodesToInsert, exportStandard(mockGraphQLCall)]
        }
      },
    },
  }
}
