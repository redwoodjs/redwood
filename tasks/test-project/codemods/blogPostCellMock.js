export default (file, api) => {
  const j = api.jscodeshift
  const mockFunction = j(file.source).find(j.ArrowFunctionExpression)

  j(mockFunction)
    .find(j.ObjectExpression)
    .forEach(({ node }) => {
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
}
