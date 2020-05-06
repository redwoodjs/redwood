// This is supposed to wrap a file that's has a suffix of `Cell` in Redwood's `withCell` higher order component.
// The HOC is responsible for the lifecycle methods during a graphQL query.
// The end result of this plugin is something like:
// ```js
// import { withCell } from '@redwoodjs/web'
// export default withCell({ QUERY, Loading, Succes, Failure, Empty, beforeQuery, afterQuery })
// ```
module.exports = function ({ types: t }) {
  // These are the expected named exports from a Cell file.
  const EXPORTS_FROM_CELL = [
    'QUERY',
    'Loading',
    'Success',
    'Failure',
    'Empty',
    'beforeQuery',
    'afterQuery',
  ]

  let exportNames = []

  return {
    visitor: {
      Program: {
        exit(path) {
          // import { withCell } from '@redwoodjs/web'
          path.node.body.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('withCell'),
                  t.identifier('withCell')
                ),
              ],
              t.stringLiteral('@redwoodjs/web')
            )
          )

          // export default withCell({ QUERY?, Loading?, Succes?, Failure?, Empty?, beforeQuery?, afterQuery? })
          path.node.body.push(
            t.exportDefaultDeclaration(
              t.callExpression(t.identifier('withCell'), [
                t.objectExpression(
                  exportNames.map((name) =>
                    t.objectProperty(
                      t.identifier(name),
                      t.identifier(name),
                      false,
                      true
                    )
                  )
                ),
              ])
            )
          )

          exportNames = []
        },
      },
      ExportNamedDeclaration(path) {
        const { declaration } = path.node

        let name
        if (declaration.type === 'VariableDeclaration') {
          name = declaration.declarations[0].id.name
        }

        if (declaration.type === 'FunctionDeclaration') {
          name = declaration.id.name
        }

        if (EXPORTS_FROM_CELL.includes(name)) {
          exportNames.push(name)
        }
      },
    },
  }
}
