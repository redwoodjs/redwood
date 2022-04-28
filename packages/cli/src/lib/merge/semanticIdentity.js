export const semanticIdentifier = {
  getId(path) {
    const identity = {
      get(path) {
        return path.type in this ? this[path.type](path) : [path.type]
      },
      ObjectProperty: (path) => [path.node.key.name],
      VariableDeclarator: (path) => [path.node.id.name],
      ImportDeclaration: (path) => [
        'ImportDeclaration',
        'source',
        path.node.source.value,
      ],
    }

    return path
      .getAncestry()
      .reduce((acc, i) => [...identity.get(i), ...acc], [])
      .join('.')
  },

  // A node is its own ancestor.
  isAncestor(potentialAncestorId, potentialDescendantId) {
    // Note the difference between this and maybeChildId.startsWith(parentId)
    // We need to cover edge cases like foo.bar.baz vs foo.bar.bazzy
    const parent = potentialAncestorId.split('.')
    const maybeChild = potentialDescendantId.split('.')
    return (
      parent.length <= maybeChild.length &&
      parent.every((v, i) => v === maybeChild[i])
    )
  },
}
