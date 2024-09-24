const body = `
<p className="font-light">
This site was created to demonstrate my mastery of Redwood: Look on my
works, ye mighty, and despair!
</p>
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // Remove the `{ Link, routes }` imports that are generated and unused
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/router',
      },
    })
    .remove()
  // Remove the `{ Metadata }` import that is generated and unused
  root
    .find(j.ImportDeclaration, {
      source: {
        type: 'StringLiteral',
        value: '@redwoodjs/web',
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
