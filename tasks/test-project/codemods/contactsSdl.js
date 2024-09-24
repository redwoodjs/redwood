const mutation = `
type Mutation {
  createContact(input: CreateContactInput!): Contact @requireAuth
}
`

export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  return root
    .find(j.VariableDeclarator, {
      id: {
        type: 'Identifier',
        name: 'schema',
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      const schema = `${node.init.quasi.quasis[0].value.raw} ${mutation}`
      node.init.quasi = j.templateLiteral(
        [j.templateElement({ raw: schema, cooked: schema }, true)],
        [],
      )
      return node
    })
    .toSource()
}
