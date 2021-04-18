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

  const findRoute = (path) =>
    root
      .find(j.JSXElement, {
        type: 'JSXElement',
        openingElement: {
          type: 'JSXOpeningElement',
          attributes: [
            {
              type: 'JSXAttribute',
              value: {
                type: 'Literal',
                value: path,
              },
            },
          ],
        },
      })
      .get(0).node

  return root
    .find(j.JSXElement)
    .at(0)
    .replaceWith((nodePath) => {
      const { node } = nodePath
      const routes = ['/', '/contact', '/blog-post/{id:Int}', '/about']
      const routesNodes = routes.map((route) => findRoute(route))

      let filtered = node.children
        .filter((element) => {
          if (element.type === 'JSXText') {
            return false
          }
          return element.openingElement.attributes.every((attribute) => {
            if (attribute.value === null) {
              return !routes.includes(attribute.value)
            }
            return !routes.includes(attribute.value.value)
          })
        })
        .reduce((acc, value) => [...acc, j.jsxText('\n'), value], [])

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
          [
            ...routesNodes.reduce(
              (acc, node) => [...acc, j.jsxText('\n'), node],
              []
            ),
          ]
        ),
        ...filtered,
        j.jsxText('\n'),
      ]

      return node
    })
    .toSource()
}
