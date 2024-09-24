const body = `
<WaterfallBlogPostCell id={id} />
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const importComponent = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('WaterfallBlogPostCell'))],
    j.stringLiteral('src/components/WaterfallBlogPostCell'),
  )

  root.find(j.ImportDeclaration).at(-1).insertAfter(importComponent)

  root
    .find(j.ImportDeclaration, { source: { value: '@redwoodjs/router' } })
    .remove()

  root
    .find(j.ImportDeclaration, { source: { value: '@redwoodjs/web' } })
    .remove()

  return root
    .find(j.VariableDeclarator, {
      id: { type: 'Identifier', name: 'WaterfallPage' },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body = body

      return node
    })
    .toSource()
}
