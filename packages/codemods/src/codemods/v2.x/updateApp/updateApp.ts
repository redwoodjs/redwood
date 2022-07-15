import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const ast = j(file.source)

  ast
    .find(j.ImportDeclaration, { source: { value: '@clerk/clerk-react' } })
    .forEach((importDeclaration) => {
      console.log('importDeclaration', importDeclaration)

      importDeclaration?.value.specifiers?.forEach((specifier) => {
        if (
          j.ImportSpecifier.check(specifier) &&
          specifier.imported.name === 'withClerk'
        ) {
          // Found `withClerk` import. Now I want to replace that with a
          // `ClerkLoaded` import instead
          specifier.imported.name = 'ClerkLoaded'
        }
      })
    })

  // Remove old RW Clerk components
  ast.find(j.VariableDeclaration).forEach((variableDeclaration) => {
    console.log('variableDeclaration', variableDeclaration)
    if (
      variableDeclaration.value.declarations.find((declaration) => {
        return (
          j.VariableDeclarator.check(declaration) &&
          j.Identifier.check(declaration.id) &&
          (declaration.id.name === 'ClerkAuthProvider' ||
            declaration.id.name === 'ClerkAuthConsumer')
        )
      })
    ) {
      console.log('found ClerkAuthProvider', variableDeclaration)
      j(variableDeclaration).remove()
    }
  })

  ast.find(j.VariableDeclaration).insertBefore(`
const ClerkAuthProvider = ({ children }) => {
  const frontendApi = process.env.CLERK_FRONTEND_API_URL
  if (!frontendApi) {
    throw new Error('Need to define env variable CLERK_FRONTEND_API_URL')
  }

  return (
    <ClerkProvider frontendApi={frontendApi} navigate={(to) => navigate(to)}>
      <ClerkLoaded>
        {children}
      </ClerkLoaded>
    </ClerkProvider>
  )
}`)

  return ast.toSource()
}
