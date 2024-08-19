const query = `
  query BlogPostsQuery {
    blogPosts: posts {
      id
      title
      body
      author {
        email
        fullName
      }
      createdAt
    }
  }
`
const successBody = `<div className="divide-y divide-grey-700">
{blogPosts.map((post) => <BlogPost key={post.id} blogPost={post} />)}
</div>`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const importComponent = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('BlogPost'))],
    j.stringLiteral('src/components/BlogPost'),
  )

  root.find(j.ExportNamedDeclaration).at(0).insertBefore(importComponent)

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

  return root
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
}
