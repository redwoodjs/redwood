const body = '<span>{author.fullName} ({author.email})</span>'

const propsInterface = `
interface Props {
  author: {
    email: string
    fullName: string
  }
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  if (file.path.endsWith('.tsx')) {
    root.find(j.VariableDeclaration).insertBefore(propsInterface)

    // Convert "const Author = ()"
    // to "const Author = ({ author }: Props)"
    root
      .find(j.ArrowFunctionExpression)
      .at(0)
      .replaceWith((nodePath) => {
        const { node } = nodePath
        node.params = ['{ author }: Props']
        return node
      })
  }

  return root
    .find(j.VariableDeclarator, {
      id: { type: 'Identifier', name: 'Author' },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[0].argument = body
      return node
    })
    .toSource()
}
