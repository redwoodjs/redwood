import type { CommentKind } from 'ast-types/gen/kinds'
import type { FileInfo, API } from 'jscodeshift'

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift

  const ast = j(file.source)

  ast
    .find(j.ImportDeclaration, { source: { value: '@clerk/clerk-react' } })
    .forEach((importDeclaration) => {
      importDeclaration?.value.specifiers?.forEach((specifier) => {
        if (
          j.ImportSpecifier.check(specifier) &&
          specifier.imported.name === 'withClerk'
        ) {
          // Found `withClerk` import. Now I want to replace that with a
          // `ClerkLoaded` import instead
          specifier.imported.name = 'ClerkLoaded'

          // And finally, for the imports, we need to add a new import to give us `navigate`
          j(importDeclaration).insertAfter(
            "import { navigate } from '@redwoodjs/router'"
          )
        }
      })
    })

  let comments: CommentKind[] = []

  // Remove old RW Clerk components
  ast.find(j.VariableDeclaration).forEach((variableDeclaration) => {
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
      comments = [...comments, ...(variableDeclaration.value.comments || [])]
      j(variableDeclaration).remove()
    }
  })

  const appVariableDeclaration = ast.find(j.VariableDeclaration, {
    declarations: [
      {
        id: { name: 'App' },
      },
    ],
  })

  const clerkAuthProvider = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('ClerkAuthProvider'),
      j.arrowFunctionExpression(
        [j.identifier('({ children })')],
        j.jsxExpressionContainer(
          j.identifier(`
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
`)
        )
      )
    ),
  ])
  clerkAuthProvider.comments = comments

  appVariableDeclaration.insertBefore([clerkAuthProvider])

  return ast.toSource()
}
