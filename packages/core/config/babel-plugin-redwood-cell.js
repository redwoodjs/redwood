module.exports = function ({ types: t }) {
  const names = [
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

        if (names.includes(name)) {
          exportNames.push(name)
        }
      },
    },
  }
}
