import type { FileInfo, API, ImportSpecifier } from 'jscodeshift'

const apiExports = [
  'DbAuthHandler',
  'dbAuthSession',
  'getAuthProviderHeader',
  'getAuthenticationContext',
  'parseAuthorizationHeader',
  'parseJWT',
  'prismaVersion',
  'redwoodVersion',
]

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const ast = j(file.source)

  const apiSpecifiers = new Set()
  const graphqlServerSpecifiers = new Set()

  // Find all named import statements from '@redwoodjs/api'.
  // Seprate their specifiers.
  ast
    .find(j.ImportDeclaration, { source: { value: '@redwoodjs/api' } })
    .forEach((importDeclaration) => {
      const { specifiers } = importDeclaration.node

      ;(specifiers as Array<ImportSpecifier> | undefined)?.forEach(
        (specifier) => {
          const { name } = specifier.imported

          if (apiExports.includes(name)) {
            apiSpecifiers.add(name)
          } else {
            graphqlServerSpecifiers.add(name)
          }
        }
      )

      j(importDeclaration).remove()
    })

  // Insert new import declarations at the top.
  if (apiSpecifiers.size) {
    ast
      .find(j.Program)
      .get('body', 0)
      .insertBefore(
        `import { ${[...apiSpecifiers].join(', ')} } from '@redwoodjs/api'`
      )
  }

  if (graphqlServerSpecifiers.size) {
    ast
      .find(j.Program)
      .get('body', 0)
      .insertBefore(
        `import { ${[...graphqlServerSpecifiers].join(
          ', '
        )} } from '@redwoodjs/graphql-server'`
      )
  }

  return ast.toSource()
}
