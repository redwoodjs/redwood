import path from 'path'

import type { PluginObj, types } from '@babel/core'
// TODO: Figure out why Wallaby doesn't work with a normal import.
import { getBaseDirFromFile } from '@redwoodjs/internal/dist/paths'
import { getProject } from '@redwoodjs/structure'

export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-mock-cell-data',
    visitor: {
      ExportNamedDeclaration(p, state: { file?: any }) {
        // This converts a call of "mockCellData" into a "mockGraphQLQuery" by automatically:
        // Determining the query operation name for `QUERY` and,
        // wrapping the exported data in `afterQuery`
        //
        // Rules:
        // 0. Must be a *.mock.[ts,js] file.
        // 1. That has a named export called "standard".
        // 2. That calls "mockCellData".
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

        const init = vd?.init as types.CallExpression
        const calleeName = (init?.callee as types.Identifier)?.name
        if (calleeName !== 'mockCellData') {
          return
        }

        // Find the model of the Cell that is in the same directory.
        const filename = state.file.opts.filename
        const dir = path.dirname(state.file.opts.filename)
        const project = getProject(getBaseDirFromFile(filename))
        const cell = project.cells.find((x) => x.filePath.startsWith(dir))
        if (!cell) {
          return
        }

        if (!cell.queryOperationName) {
          return
        }

        // export const standard
        const exportStandard = (init: types.CallExpression) =>
          t.exportNamedDeclaration(
            t.variableDeclaration('const', [
              t.variableDeclarator(t.identifier('standard'), init),
            ])
          )

        // mockGraphQLQuery(<operationName>, <data>)
        const mockGraphQLCall = t.callExpression(
          t.identifier('mockGraphQLQuery'),
          [t.stringLiteral(cell.queryOperationName), init.arguments[0]]
        )

        // + import { afterQuery } from './'
        if (cell.exportedSymbols.has('afterQuery')) {
          const importAfterQuery = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier('afterQuery'),
                t.identifier('afterQuery')
              ),
            ],
            t.stringLiteral('./')
          )
          p.insertBefore(importAfterQuery)

          p.replaceWith(
            exportStandard(
              t.callExpression(t.identifier('afterQuery'), [mockGraphQLCall])
            )
          )
        } else {
          p.replaceWith(exportStandard(mockGraphQLCall))
        }

        // - export const standard = mockData(<data>)
        // p.remove()
      },
      // CallExpression(p, state: { file?: any }) {
      //   if ((p.node.callee as types.Identifier)?.name !== 'getMockData') {
      //     return
      //   }
      //   const dirName = cleanFileName(state.file.opts.filename)
      //   const key = (p.node.arguments[0] as types.StringLiteral)?.value
      //   // - getMockData(<key>)
      //   // + __RW__AUTO_getMockData(`${dirName}:${exportName}`)
      //   p.replaceWith(
      //     t.callExpression(t.identifier('__RW__getMockData'), [
      //       t.stringLiteral(dirName + ':' + key),
      //     ])
      //   )
      // },
    },
  }
}
