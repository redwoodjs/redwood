export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)
  const mockFunction = root.find(j.ArrowFunctionExpression)

  mockFunction.find(j.ObjectExpression).forEach(({ node, name }) => {
    // Skip the top level object
    if (name === 'body') {
      return
    }
    node.properties.push(
      j.property('init', j.identifier('title'), j.literal('Mocked title'))
    )
    node.properties.push(
      j.property('init', j.identifier('body'), j.literal('Mocked body'))
    )
    node.properties.push(
      j.property(
        'init',
        j.identifier('createdAt'),
        j.literal('2022-01-17T13:57:51.607Z')
      )
    )
  })

  return root.toSource()
}
