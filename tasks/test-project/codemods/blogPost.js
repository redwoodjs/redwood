const body = `
<article>
{blogPost && (
  <>
    <header className="mt-4">
      <p className="text-sm">
        {new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(new Date(blogPost.createdAt))} - By:{' '}
        <Author author={blogPost.author} />
      </p>
      <h2 className="text-xl mt-2 font-semibold">
        <Link
          className="hover:text-blue-600"
          to={routes.blogPost({ id: blogPost.id })}
        >
          {blogPost.title}
        </Link>
      </h2>
    </header>
    <div className="mt-2 mb-4 text-gray-900 font-light">
      {blogPost.body}
    </div>
  </>
)}
</article>
`

const propsInterface = `
interface Props extends FindBlogPostQuery {}
`

const typeImport = `import { FindBlogPostQuery } from 'types/graphql'`
const authorCellImport = `import Author from 'src/components/Author'`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  const routerImport = j.importDeclaration(
    [
      j.importSpecifier(j.identifier('Link'), j.identifier('Link')),
      j.importSpecifier(j.identifier('routes'), j.identifier('routes')),
    ],
    j.stringLiteral('@redwoodjs/router'),
  )

  root.find(j.VariableDeclaration).insertBefore(routerImport)

  if (file.path.endsWith('.tsx')) {
    root.find(j.VariableDeclaration).insertBefore(propsInterface)
    root.find(j.ImportDeclaration).insertAfter(authorCellImport)
    root.find(j.ImportDeclaration).insertAfter(typeImport)

    // Convert "const BlogPost = () "
    // to "const BlogPost = ({ blogPost }: Props) "
    root
      .find(j.ArrowFunctionExpression)
      .at(0)
      .replaceWith((nodePath) => {
        const { node } = nodePath
        node.params = ['{ blogPost }: Props']
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
