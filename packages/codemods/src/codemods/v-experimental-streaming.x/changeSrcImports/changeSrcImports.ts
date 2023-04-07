import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  // Find all ImportDeclaration nodes with a 'src/' module specifier
  ast
    .find(j.ImportDeclaration)
    .filter((node) => {
      if (typeof node.value.source.value === 'string') {
        return node.value.source.value.startsWith('src/')
      }
      return false
    })
    .forEach((node) => {
      console.log(`👉 \n ~ file: changeSrcImports.ts:15 ~ node:`, node)
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      const source = node.source.value as string
      // Replace the 'src/' module specifier with 'api/src/'
      node.source.value = source.replace(/^src\//, 'api/src/')
      return node
    })

  return ast.toSource()
}
