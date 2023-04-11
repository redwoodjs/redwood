import type {
  FileInfo,
  API,
  // ArrayExpression,
  // ObjectProperty,
} from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const root = j(file.source)

  // Find the last import declaration in the file
  const lastImport = root.find(j.ImportDeclaration).at(-1)

  // Create a new import declaration for the InngestPlugin
  const newImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('inngestPlugin'))],
    j.literal('src/inngest/plugin')
  )

  // Get the last import's source code to determine whether or not to add a newline
  const lastImportSource = lastImport.get().value.source
  const shouldAddNewline =
    !lastImportSource ||
    lastImportSource.type !== 'Literal' ||
    lastImportSource.value.slice(-1) !== '\n'

  // Insert the new import declaration after the last one in the file, with or without a newline
  lastImport.insertAfter(
    shouldAddNewline ? j.template.statement`\n${newImport}` : newImport
  )

  root
    .find(j.CallExpression, {
      callee: {
        type: 'Identifier',
        name: 'createGraphQLHandler',
      },
    })
    .forEach((path) => {
      const properties = path.node.arguments[0]
      const hasExtraPlugins = properties.properties.some(
        (property) => property.key.name === 'extraPlugins'
      )
      if (!hasExtraPlugins) {
        const extraPluginsProperty = j.property(
          'init',
          j.identifier('extraPlugins'),
          j.arrayExpression([])
        )
        properties.properties.push(extraPluginsProperty)
      }
    })
  return root.toSource()
}
