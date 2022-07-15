import type { FileInfo, API, Identifier, MemberExpression } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  ast.find(j.ExpressionStatement).forEach((path) => {
    if (path.value.expression.type === 'AssignmentExpression') {
      const lhs = path.value.expression.left as MemberExpression
      if (lhs.type === 'MemberExpression') {
        const rhs = path.value.expression.right as Identifier
        if (rhs.name === 'config') {
          if (lhs) {
            j(path).replaceWith(
              j.expressionStatement(
                j.assignmentExpression(
                  '=',
                  j.identifier('module.exports'),
                  j.identifier('{ config }')
                )
              )
            )
          }
        }
      }
    }
  })

  return ast.toSource()
}
