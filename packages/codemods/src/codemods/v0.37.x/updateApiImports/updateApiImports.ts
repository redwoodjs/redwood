import type { FileInfo, API } from 'jscodeshift'

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

export default function transformer(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const ast = j(file.source)

  const apiSpecifiers = new Set()
  const graphqlServerSpecifiers = new Set()

  // Step 1: Find all named import statements from '@redwoodjs/api'
  ast
    .find(j.ImportDeclaration, { source: { value: '@redwoodjs/api' } })
    .forEach((importDeclaration) => {
      const { specifiers } = importDeclaration.node
      // Step 2: For each import, check against list of api exports
      specifiers?.forEach((specifier) => {
        const { name } = specifier.imported
        // if in list: leave the import
        if (apiExports.includes(name)) {
          apiSpecifiers.add(name)
          // if not: push import to array, remove the import and add import from gql server
        } else {
          graphqlServerSpecifiers.add(name)
        }
      })
    })

  ast
    .find(j.Program)
    .get('body', 0)
    .insertBefore(
      `import { ${[...apiSpecifiers].join(', ')} } from '@redwoodjs/api'`
    )

  ast
    .find(j.Program)
    .get('body', 0)
    .insertBefore(
      `import { ${[...graphqlServerSpecifiers].join(
        ', '
      )} } from '@redwoodjs/graphql-server'`
    )
}
