import { parse } from 'path'

import type { PluginObj, types } from '@babel/core'

// This wraps a file that has a suffix of `Cell` in Redwood's `createCell` higher
// order component. The HOC deals with the lifecycle methods during a GraphQL query.
//
// ```js
// import { createCell } from '@redwoodjs/web'
// <YOUR CODE>
// export default createCell({ QUERY, Loading, Success, Failure, isEmpty, Empty, beforeQuery, afterQuery, displayName })
// ```
//
// To debug the output of the plugin, you can use the following:
// ```
// import generate from '@babel/generator'
// ...
// console.log(generate(path.node).code)
// ```

// A cell can export the declarations below.
const EXPECTED_EXPORTS_FROM_CELL = [
  'beforeQuery',
  'QUERY',
  'DATA',
  'isEmpty',
  'afterQuery',
  'Loading',
  'Success',
  'Failure',
  'Empty',
]

export default function ({ types: t }: { types: typeof types }): PluginObj {
  // This array will
  // - collect exports from the Cell file during ExportNamedDeclaration
  // - collected exports will then be passed to `createCell`
  // - be cleared after Program exit to prepare for the next file
  let exportNames: string[] = []
  let hasDefaultExport = false

  // TODO (RSC):
  // This code relies on the fact that all cells first become client side
  // cells. And then we do a second pass over all cells and transform them to
  // server cells if applicable
  // It'd be better if we could only do one pass over all cells. So the real
  // todo here is to first figure out why we do two passes, and then update
  // this code to directly generate `createCell` or `createServerCell` HoCs

  return {
    name: 'babel-plugin-redwood-cell',
    visitor: {
      ExportDefaultDeclaration(path) {
        hasDefaultExport = true

        // This is for RSC cells:
        // Determine if this is `export default createCell(...)`
        // If it is, then we change it to `export default createServerCell(...)`
        const declaration = path.node.declaration
        if (
          t.isCallExpression(declaration) &&
          t.isIdentifier(declaration.callee) &&
          declaration.callee.name === 'createCell'
        ) {
          declaration.callee.name = 'createServerCell'
        }
      },
      ExportNamedDeclaration(path) {
        const declaration = path.node.declaration

        if (!declaration) {
          return
        }

        let name
        if (declaration.type === 'VariableDeclaration') {
          const id = declaration.declarations[0].id as types.Identifier
          name = id.name as string
        }
        if (declaration.type === 'FunctionDeclaration') {
          name = declaration?.id?.name
        }

        if (name && EXPECTED_EXPORTS_FROM_CELL.includes(name)) {
          exportNames.push(name)
        }
      },
      ImportDeclaration(path) {
        // This is for RSC cells:
        // Change createCell imports to createServerCell
        const source = path.node.source.value
        if (source === '@redwoodjs/web') {
          const specifiers = path.node.specifiers
          // const createCellSpecifierIndex = specifiers.findIndex(
          //   (specifier) =>
          //     t.isImportSpecifier(specifier) &&
          //     t.isIdentifier(specifier.imported) &&
          //     specifier.imported.name === 'createCell'
          // )

          // if (createCellSpecifierIndex !== -1) {
          //   const createServerCellSpecifier = t.importSpecifier(
          //     t.identifier('createServerCell'),
          //     t.identifier('createServerCell')
          //   )

          //   // Replace createCellSpecifier with createServerCellSpecifier
          //   specifiers.splice(
          //     createCellSpecifierIndex,
          //     1,
          //     createServerCellSpecifier
          //   )
          // }

          const createCellSpecifier: types.ImportSpecifier | undefined =
            specifiers.find((specifier): specifier is types.ImportSpecifier => {
              return (
                t.isImportSpecifier(specifier) &&
                t.isIdentifier(specifier.imported) &&
                specifier.imported.name === 'createCell'
              )
            })

          if (
            createCellSpecifier &&
            t.isIdentifier(createCellSpecifier.imported)
          ) {
            createCellSpecifier.imported.name = 'createServerCell'
            createCellSpecifier.local.name = 'createServerCell'

            // Also update where we import from
            path.node.source.value =
              '@redwoodjs/web/dist/components/cell/createServerCell.js'
          }

          //   specifiers.some(
          //     (specifier) =>
          //       t.isImportSpecifier(specifier) &&
          //       t.isIdentifier(specifier.imported) &&
          //       specifier.imported.name === 'createCell'
          //   )
          // ) {
          //   // hasCreateCellImport = true
          // }
        }
      },
      Program: {
        exit(path) {
          const hasQueryOrDataExport =
            exportNames.includes('QUERY') || exportNames.includes('DATA')

          // If the file already has a default export then
          //   1. It's likely not a cell, or it's a cell that's already been
          //      wrapped in `createCell`
          //   2. If we added another default export we'd be breaking JS module
          //      rules. There can only be one default export.
          // If there's no QUERY or DATA export it's not a valid cell
          if (hasDefaultExport || !hasQueryOrDataExport) {
            return
          }

          // Insert at the top of the file:
          // + import { createCell } from '@redwoodjs/web'
          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('createCell'),
                  t.identifier('createCell')
                ),
              ],
              t.stringLiteral('@redwoodjs/web')
            )
          )

          // Insert at the bottom of the file:
          // + export default createCell({ QUERY?, Loading?, Success?, Failure?, Empty?, beforeQuery?, isEmpty, afterQuery?, displayName? })
          path.node.body.push(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('createCell'), [
                t.objectExpression([
                  ...exportNames.map((name) =>
                    t.objectProperty(
                      t.identifier(name),
                      t.identifier(name),
                      false,
                      true
                    )
                  ),
                  // Add the `displayName` property so we can name the Cell
                  // after the filename.
                  t.objectProperty(
                    t.identifier('displayName'),
                    t.stringLiteral(
                      parse(this.file.opts.filename as string).name
                    ),
                    false,
                    true
                  ),
                ]),
              ])
            )
          )

          hasDefaultExport = false
          exportNames = []
        },
      },
    },
  }
}
