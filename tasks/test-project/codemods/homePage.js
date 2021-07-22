export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const cellImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('BlogPostsCell'))],
    j.stringLiteral('src/components/BlogPostsCell')
  )

  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: '@redwoodjs/router',
      },
    })
    .remove()

  root.find(j.VariableDeclaration).at(0).insertBefore(cellImport)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'HomePage',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[0].argument = j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier('BlogPostsCell'), [], true),
        null,
        []
      )
      return node
    })
    .toSource()
}
