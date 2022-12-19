export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // const author = {
  //   email: 'story.user@email.com',
  //   fullName: 'Story User',
  // }
  const authorDeclaration = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('author'),
      j.objectExpression([
        j.property('init', j.identifier('email'), j.literal('story.user@email.com')),
        j.property('init', j.identifier('fullName'), j.literal('Story User')),
      ])
    )
  ])

  root.find(j.ExportNamedDeclaration).insertBefore(authorDeclaration)

  // Change `<Author />` to `<Author author={author} />`
  root
    .find(j.JSXOpeningElement, { name: { name: 'Author' } } )
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.attributes.push(
        j.jsxAttribute(
          j.jsxIdentifier('author'),
          j.jsxExpressionContainer(j.identifier('author'))
        )
      )

      return node
    })

  return root.toSource()
}
