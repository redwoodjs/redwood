const body = `
  return db.user.findUnique({ where: { id }})
`

// When running `yarn rw g sdl --no-crud user` we get a single service method
// that gets all users `return db.user.findMany()`. We want to rewrite that to
// a method that returns a single user instead.
export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // const property = j.property('init', j.identifier('id'), j.identifier('id'))
  // property.shorthand = true

  // const params = j.objectPattern([property])

  return (
    root
      .find(j.VariableDeclarator, {
        id: {
          type: 'Identifier',
          name: 'users',
        },
      })
      // .replaceWith((nodePath) => {
      //   const { node } = nodePath
      //   node.id.name = 'user'
      //   node.id.typeAnnotation.typeAnnotation.indexType.literal.value = 'user'
      //   node.init.params[0] = params
      //   node.init.body.body[0] = body
      //   return node
      // })
      .remove()
      .toSource()
  )
}
