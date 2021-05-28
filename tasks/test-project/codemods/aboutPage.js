const body = `
<p className="font-light">
This site was created to demonstrate my mastery of Redwood: Look on my
works, ye mighty, and despair!
</p>
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'Literal',
        value: '@redwoodjs/router',
      },
    })
    .remove()

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'AboutPage',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      node.init.body.body[0].argument = body
      return node
    })
    .toSource()
}
