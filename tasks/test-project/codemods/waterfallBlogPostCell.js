const query = `
  query FindWaterfallBlogPostQuery($id: Int!) {
    waterfallBlogPost: post(id: $id) {
      id
      title
      body
      authorId
      createdAt
    }
  }
`
const successBody = `
<article>
{waterfallBlogPost && (
  <>
    <header className="mt-4">
      <p className="text-sm">
        {new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(waterfallBlogPost.createdAt))} - By:{' '}
        <AuthorCell id={waterfallBlogPost.authorId} />
      </p>
      <h2 className="text-xl mt-2 font-semibold">
        {waterfallBlogPost.title}
      </h2>
    </header>
    <div className="mt-2 mb-4 text-gray-900 font-light">
      {waterfallBlogPost.body}
    </div>
  </>
)}
</article>
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const componentImport = j.importDeclaration(
    [j.importDefaultSpecifier(j.identifier('AuthorCell'))],
    j.stringLiteral('src/components/AuthorCell'),
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
