export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  root
    .find(j.ArrowFunctionExpression)
    .find(j.ObjectExpression)
    .forEach(({ node, name }) => {
      // Skip the top level object
      if (name === 'body') {
        return
      }
      node.properties.push(
        j.property('init', j.identifier('email'), j.literal('fortytwo@42.com')),
      )
      node.properties.push(
        j.property('init', j.identifier('fullName'), j.literal('Forty Two')),
      )
    })

  // Update the __typename values
  root
    .find(j.ObjectProperty, {
      key: {
        type: 'Identifier',
        name: '__typename',
      },
    })
    .forEach(({ node }) => {
      if (
        node.value.type === 'TSAsExpression' &&
        node.value.expression.type === 'StringLiteral' &&
        node.value.expression.value === 'author'
      ) {
        node.value.expression.value = 'User'
      }
    })

  return root.toSource()
}
