export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const setImport = j.importSpecifier(j.identifier('Set'))

  const blogImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('BlogLayout'))],
    j.stringLiteral('src/layouts/BlogLayout')
  )

  root
    .find(j.ImportSpecifier, {
      imported: {
        type: 'Identifier',
        name: 'Route',
      },
    })
    .insertAfter(setImport)

  root.find(j.ImportDeclaration).insertAfter(blogImport)

  return root
    .find(j.JSXElement)
    .at(0)
    .replaceWith((nodePath) => {
      const { node } = nodePath

      node.children = [
        j.jsxText('\n'),
        j.jsxElement(
          j.jsxOpeningElement(j.jsxIdentifier('Set'), [
            j.jsxAttribute(
              j.jsxIdentifier('wrap'),
              j.jsxExpressionContainer(j.identifier('BlogLayout'))
            ),
          ]),
          j.jsxClosingElement(j.jsxIdentifier('Set')),
          [...node.children]
        ),
      ]

      return node
    })
    .toSource()
}
