import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  // Find all ImportDeclaration nodes with a 'src/' module specifier
  ast
    .find(j.ImportDeclaration, {
      source: {
        value: /^src\//,
      },
    })
    .replaceWith((nodePath) => {
      const { node } = nodePath
      console.log(`👉 \n ~ file: changeSrcImports.ts:16 ~ nodePath:`, nodePath)
      const source = node.source.value as string
      console.log(`👉 \n ~ file: changeSrcImports.ts:18 ~ source:`, source)
      // Replace the 'src/' module specifier with 'api/src/'
      node.source.value = source.replace(/^src\//, 'api/src/')
      return node
    })

  return ast.toSource()
}
