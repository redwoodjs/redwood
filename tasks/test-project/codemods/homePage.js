export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const cellImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('BlogPostsCell'))],
    j.stringLiteral('src/components/BlogPostsCell'),
  )

  // Remove the `{ Link, routes }` imports that are generated and unused
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/router',
      },
    })
    .remove()
  // Remove the `{ Metadata }` import that is generated and unused
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/web',
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
        [],
      )
      return node
    })
    .toSource()
}
