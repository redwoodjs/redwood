import type { FileInfo, API } from 'jscodeshift'

function pascalToCamel(pascalString: string) {
  const firstChar = pascalString.charAt(0).toLowerCase()
  const restOfString = pascalString.slice(1)
  return `${firstChar}${restOfString}`
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const root = j(file.source)

  // Find all import declarations with "*.svg" import
  const svgImports = root.find(j.ImportDeclaration).filter((path) => {
    const importPath = path.node.source.value as string
    return importPath.includes('.svg')
  })

  // Process each import declaration
  svgImports.forEach((importDeclaration) => {
    const importSpecifiers = importDeclaration.node.specifiers

    // Process each import specifier
    importSpecifiers?.forEach((importSpecifier) => {
      if (importSpecifier.type === 'ImportDefaultSpecifier') {
        if (!importSpecifier.local) {
          // Un-freaking-likely
          return
        }
        const originalImportedName = importSpecifier.local.name
        const camelCasedName = pascalToCamel(originalImportedName)

        // Update the import specifier to use the correct name
        importSpecifier.local.name = camelCasedName

        // Find the JSX elements that use the default import specifier
        const svgsUsedAsComponent = root.findJSXElements(originalImportedName)

        // Replace the JSX elements with the <img> tags
        svgsUsedAsComponent.forEach((svgComponent) => {
          const newImgTag = j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier('img'), [
              j.jsxAttribute(
                j.jsxIdentifier('src'),
                j.jsxExpressionContainer(j.identifier(camelCasedName))
              ),
              // make sure to preserve any other attributes
              ...(svgComponent.node.openingElement.attributes || []),
            ]),
            j.jsxClosingElement(j.jsxIdentifier('img')),
            []
          )

          svgComponent.replace(newImgTag)
        })
      }
    })
  })

  return root.toSource()
}
