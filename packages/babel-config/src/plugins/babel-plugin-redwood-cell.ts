import { parse } from 'path'

import type { PluginObj, types } from '@babel/core'
import generate from '@babel/generator'

// This wraps a file that has a suffix of `Cell` in Redwood's `createCell` higher
// order component. The HOC deals with the lifecycle methods during a GraphQL query.
//
// ```js
// import { createCell } from '@redwoodjs/web'
// <YOUR CODE>
// export default createCell({ QUERY, Loading, Success, Failure, isEmpty, Empty, beforeQuery, afterQuery, displayName })
// ```

// A cell can export the declarations below.
const EXPECTED_EXPORTS_FROM_CELL = [
  'beforeQuery',
  'QUERY',
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

  //
  // TODO (RSC):
  // There's now code added here to generate `createServerCell` related code
  // I'm not sure that should live here intertwined with the code that
  // generates `createCell` related code.
  // Perhaps it's better to have two separate plugins.
  //

  // let hasCreateCellImport = false

  return {
    name: 'babel-plugin-redwood-cell',
    visitor: {
      ExportDefaultDeclaration(path) {
        hasDefaultExport = true

        // Determine if this is `export default createCell(...)`
        // If it is, then we change it to `export default createServerCell(...)`
        const declaration = path.node.declaration
        if (
          t.isCallExpression(declaration) &&
          t.isIdentifier(declaration.callee) &&
          declaration.callee.name === 'createCell'
        ) {
          console.log('updating to `export default createServerCell(...)`')
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
        console.log('ImportDeclaration from', path.node.source.value)

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
            console.log('set import name to createServerCell')
            createCellSpecifier.imported.name = 'createServerCell'
            createCellSpecifier.local.name = 'createServerCell'
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
          console.log()
          console.log('exiting')
          console.log('exiting')
          console.log()
          console.log()
          console.log(generate(path.node).code)
          console.log()
          console.log()
          console.log('exiting')
          console.log('-------')
          console.log()
          // If the file already has a default export then
          //   1. It's likely not a cell, or it's a cell that's already been
          //      wrapped in `createCell`
          //   2. If we added another default export we'd be breaking JS module
          //      rules. There can only be one default export.
          // If there's no QUERY or DATA export it's not a valid cell
          if (
            hasDefaultExport ||
            !(exportNames.includes('QUERY') || exportNames.includes('DATA'))
          ) {
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
                  /**
                   * Add the `displayName` property
                   * so we can name the Cell after the filename.
                   */
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
