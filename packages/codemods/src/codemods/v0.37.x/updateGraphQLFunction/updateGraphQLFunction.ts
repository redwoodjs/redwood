import type { FileInfo, API } from 'jscodeshift'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  const outputAst = j(file.source)

  // STEP 1: Update imports
  outputAst.find(j.ImportDeclaration).forEach((path) => {
    // 1. Updates import statement to be
    // import { createGraphqlServer } from '@redwoodjs/graphqlserver'
    if (path.value.source.value === '@redwoodjs/api') {
      j(path).replaceWith(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('createGraphQLHandler'))],
          j.literal('@redwoodjs/graphql-server')
        )
      )
    }

    // 2. Update glob imports
    // This replaces the old schemas import with sdls
    // And also adds the directives import
    if (path.value.source.value === 'src/graphql/**/*.{js,ts}') {
      j(path).replaceWith([
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('directives'))],
          j.literal('src/directives/**/*.{js,ts}')
        ),
        j.importDeclaration(
          [j.importDefaultSpecifier(j.identifier('sdls'))],
          j.literal('src/graphql/**/*.sdl.{js,ts}')
        ),
      ])
    }
  })

  // STEP 2: Remove makeMergedSchema, pass in directives, sdls and services
  outputAst
    .find(j.CallExpression, { callee: { name: 'createGraphQLHandler' } })
    .forEach((path) => {
      const schemaProp = j(path.node).find(j.ObjectProperty, {
        key: { name: 'schema' },
      })
      schemaProp.replaceWith([
        j.identifier('directives'),
        j.identifier('sdls'),
        j.identifier('services'),
      ])
    })

  return outputAst.toSource({ trailingComma: true, quote: 'single' })
}
