import type {
  FileInfo,
  API,
  ArrayExpression,
  ObjectProperty,
  Identifier,
} from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const root = j(file.source)

  const inngestImport = j.importDeclaration(
    [j.importSpecifier(j.identifier('inngestPlugin'))],
    j.literal('src/inngest/plugin')
  )

  // Check if inngestPlugin is already imported
  const existingInngestImport =
    root
      .find(j.ImportSpecifier, {
        imported: { name: 'inngestPlugin' },
      })
      .size() > 0

  if (!existingInngestImport) {
    // Find the last import statement in the file
    const lastImport = root.find(j.ImportDeclaration).at(-1)

    lastImport.insertAfter(inngestImport)
  }

  // Find CreateGraphQLHandler call
  root
    .find(j.CallExpression, {
      callee: {
        name: 'createGraphQLHandler',
      },
    })
    .replaceWith((path) => {
      const optionsArg = path.node.arguments[0]
      const optionsProps = j.objectExpression([])

      // Check if optionsArg is an object expression
      if (j.ObjectExpression.check(optionsArg)) {
        optionsProps.properties = optionsArg.properties
      }

      const extraPluginsProp = optionsProps.properties?.find(
        (p): p is ObjectProperty =>
          j.ObjectProperty.check(p) &&
          j.Identifier.check(p.key) &&
          p.key.name === 'extraPlugins'
      )

      if (extraPluginsProp) {
        // `extraPlugins` property already exists
        const existingInngestPlugin =
          extraPluginsProp &&
          j.ArrayExpression.check(extraPluginsProp.value) &&
          extraPluginsProp.value.elements.some(
            (el): el is Identifier =>
              j.Identifier.check(el) && el.name === 'inngestPlugin'
          )

        if (!existingInngestPlugin) {
          ;(extraPluginsProp.value as ArrayExpression).elements.push(
            j.identifier('inngestPlugin')
          )
        }
      } else {
        // `extraPlugins` property does not exist
        optionsProps.properties?.push(
          j.property(
            'init',
            j.identifier('extraPlugins'),
            j.arrayExpression([j.identifier('inngestPlugin')])
          )
        )
      }

      path.node.arguments[0] = optionsProps
      return path.node
    })

  return root.toSource()
}
