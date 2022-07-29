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
        j.property('init', j.identifier('email'), j.literal('fortytwo@42.com'))
      )
      node.properties.push(
        j.property('init', j.identifier('fullName'), j.literal('Forty Two'))
      )
    })

  return root.toSource()
}
