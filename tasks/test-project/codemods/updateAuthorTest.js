export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // const author = {
  //   email: 'test.user@email.com',
  //   fullName: 'Test User',
  // }
  const authorDeclaration = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('author'),
      j.objectExpression([
        j.property(
          'init',
          j.identifier('email'),
          j.literal('test.user@email.com'),
        ),
        j.property('init', j.identifier('fullName'), j.literal('Test User')),
      ]),
    ),
  ])

  root.find(j.ExpressionStatement).at(0).insertBefore(authorDeclaration)

  // Change `<Author />` to `<Author author={author} />`
  root
    .find(j.JSXOpeningElement, { name: { name: 'Author' } })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier('author'),
          j.jsxExpressionContainer(j.identifier('author')),
        ),
      )

      return node
    })

  return root.toSource()
}
