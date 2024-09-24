export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const setImport = j.importSpecifier(j.identifier('Set'))
  const privateImport = j.importSpecifier(j.identifier('Private'))

  const blogImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('BlogLayout'))],
    j.stringLiteral('src/layouts/BlogLayout'),
  )

  const homePageImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('HomePage'))],
    j.stringLiteral('src/pages/HomePage'),
  )

  root
    .find(j.ImportSpecifier, {
      imported: {
        type: 'Identifier',
        name: 'Route',
      },
    })
    .insertAfter(setImport)
    .insertAfter(privateImport)

  root
    .find(j.ImportDeclaration)
    .insertAfter(blogImport)
    .insertAfter(homePageImport)

  root
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
              j.jsxExpressionContainer(j.identifier('BlogLayout')),
            ),
          ]),
          j.jsxClosingElement(j.jsxIdentifier('Set')),
          [...node.children],
        ),
      ]

      return node
    })

  // Wrap profile page in <Private>
  return root
    .findJSXElements('Route')
    .filter(
      j.filters.JSXElement.hasAttributes({
        name: 'profile',
        path: '/profile',
      }),
    )
    .at(0)
    .replaceWith((nodePath) => {
      const { node } = nodePath

      const privateSetWrapped = j.jsxElement(
        j.jsxOpeningElement(j.jsxIdentifier('Private'), [
          j.jsxAttribute(
            j.jsxIdentifier('unauthenticated'),
            j.literal('login'),
          ),
        ]),
        j.jsxClosingElement(j.jsxIdentifier('Private')),
        [node],
      )

      return privateSetWrapped
    })
    .toSource()
}
