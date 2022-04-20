// INFO: "Semantics"
// For this merge approach, we need to uniquely identify declarations across multiple JS files,
// regardless of physical position. I.e, if two files both contain "export const foo = 1", it doesn't
// matter where in the files they appear. The two exports should be considered identical for merging
// purposes. So, a declaration's "semantic identity", roughly speaking, is an identifier such that
// two declarations with the same semantic identity would produce a name collision. This is handled
// slightly differently for ImportDeclarations, which are uniquely identified by their import source.
export function semanticIdentity(path) {
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
}

// A node is its own ancestor.
export function isSemanticAncestor(parentId, maybeChildId) {
  // Note the difference between this and maybeChildId.startsWith(parentId)
  // We need to cover edge cases like foo.bar.baz vs foo.bar.bazzy
  const parent = parentId.split('.')
  const maybeChild = maybeChildId.split('.')
  return (
    parent.length <= maybeChild.length &&
    parent.every((v, i) => v === maybeChild[i])
  )
}
