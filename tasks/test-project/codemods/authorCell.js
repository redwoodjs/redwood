const query = `
  query FindAuthorQuery($id: Int!) {
    author: user(id: $id) {
      email
      fullName
    }
  }
`
const successBody = `<span className="author-cell">
  <Author author={author} />
</span>`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const componentImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('Author'))],
    j.stringLiteral('src/components/Author'),
  )

  root.find(j.ExportNamedDeclaration).at(0).insertBefore(componentImport)

  root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'QUERY',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.quasi = j.templateLiteral(
        [j.templateElement({ raw: query, cooked: query }, true)],
        [],
      )
      return node
    })

  const rootSource = root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'Success',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body = successBody
      return node
    })
    .toSource()

  const rootSourceSpan = rootSource
    .replaceAll('<div', '<span')
    .replaceAll('</div', '</span')

  return rootSourceSpan
}
