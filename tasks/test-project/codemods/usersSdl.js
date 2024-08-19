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

      const initialSchema = node.init.quasi.quasis[0].value.raw
      const schema = initialSchema
        .split('\n')
        .map((line) => {
          if (
            line.includes('hashedPassword:') ||
            line.includes('salt:') ||
            line.includes('resetToken:') ||
            line.includes('resetTokenExpiresAt:')
          ) {
            return undefined
          }

          if (line.trim() === 'users: [User!]! @requireAuth') {
            return '    user(id: Int!): User @skipAuth'
          }

          return line
        })
        .filter((line) => line !== undefined)
        .join('\n')

      node.init.quasi = j.templateLiteral(
        [j.templateElement({ raw: schema, cooked: schema }, true)],
        [],
      )
      return node
    })
    .toSource()
}
