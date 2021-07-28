const body = `
<article>
  <header className="mt-4">
    <p className="text-sm">
      {new Intl.DateTimeFormat('en-US', {  year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(post.createdAt))}
    </p>
    <h2 className="text-xl mt-2 font-semibold">
      <Link className="hover:text-blue-600" to={routes.blogPost({ id: post.id })}>{post.title}</Link>
    </h2>
  </header>
  <div className="mt-2 mb-4 text-gray-900 font-light">{post.body}</div>
</article>
`

const propsInterface = `
interface Props {
  post: { id: string, title: string, body: string, createdAt: string }
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const routerImport = j.importDeclaration(
    [
      j.importSpecifier(j.identifier('Link'), j.identifier('Link')),
      j.importSpecifier(j.identifier('routes'), j.identifier('routes')),
    ],
    j.stringLiteral('@redwoodjs/router')
  )

  root.find(j.VariableDeclaration).insertBefore(routerImport)

  if (file.path.endsWith('.tsx')) {
    root.find(j.VariableDeclaration).insertBefore(propsInterface)

    // Convert "const BlogPost = () "
    // to "const BlogPost = ({ posts }: Props) "
    root
      .find(j.ArrowFunctionExpression)
      .at(0)
      .replaceWith((nodePath) => {
        const { node } = nodePath
        node.params = ['{ post }: Props']
        return node
      })
  }

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'BlogPost',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[0].argument = body
      return node
    })
    .toSource()
}
