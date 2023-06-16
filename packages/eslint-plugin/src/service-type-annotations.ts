import { basename } from 'path'

// Provides a high level wrapper for ESLint with
// TypeScript support: https://typescript-eslint.io/custom-rules/#utils-package
import { ESLintUtils } from '@typescript-eslint/utils'

// In the future add a docs page?
// const createRule = ESLintUtils.RuleCreator(
//   (name) => `https://orta.io/rule/noop/${name}`
// )

// TODO: This, and the above dep, might be optional, as we don't use any
// TS prefixes in the AST lookups.
const createRule = ESLintUtils.RuleCreator.withoutDocs

export const serviceTypeAnnotations = createRule({
  create(context) {
    const thisFilename = basename(context.getFilename())
    const thisFileCorrespondingImport = `types/${thisFilename.replace(
      '.ts',
      ''
    )}`

    /** @type {import("@typescript-eslint/types/dist/generated/ast-spec").ImportDeclaration} */
    let importForThisFile = null
    return {
      ImportDeclaration(node) {
        importForThisFile ||=
          node.source.value === thisFileCorrespondingImport ? node : null
      },

      ExportNamedDeclaration(node) {
        if (!node.declaration) {
          return
        }
        if (!node.declaration.declarations) {
          return
        }

        node.declaration.declarations.forEach((vd) => {
          // VariableDeclarator means an `export const abcThing =`
          if (vd.type === 'VariableDeclarator' && vd.id.type === 'Identifier') {
            if (vd.id.name.startsWith('_')) {
              return
            }

            // Lowercase means something we think should be an query/mutation fn
            const isGlobalOrMutationResolver = /^[a-z]/.test(vd.id.name)

            const suffix = isGlobalOrMutationResolver
              ? 'Resolver'
              : 'TypeResolvers'
            const typeName = capitalizeFirstLetter(vd.id.name) + suffix

            // Only run for lowercase  arrow funcs ATM
            if (
              isGlobalOrMutationResolver &&
              vd.init?.type !== 'ArrowFunctionExpression'
            ) {
              return
            }

            // If there's no type annotation, then we should add one
            if (!vd.id.typeAnnotation) {
              context.report({
                messageId: 'needsType',
                node: vd.id,
                data: {
                  name: vd.id.name,
                  typeName,
                },
                *fix(fixer) {
                  yield fixer.insertTextAfter(vd.id, `: ${typeName}`)
                  if (!importForThisFile) {
                    yield fixer.insertTextBeforeRange(
                      [0, 0],
                      `import { ${typeName} } from "${thisFileCorrespondingImport}"\n`
                    )
                  } else {
                    const lastImportSpecifier =
                      importForThisFile.specifiers[
                        importForThisFile.specifiers.length - 1
                      ]
                    yield fixer.insertTextAfter(
                      lastImportSpecifier,
                      `, ${typeName}`
                    )
                  }
                },
              })

              return
            }

            // If there is one and it's wrong, edit it
            if (vd.id.typeAnnotation.typeAnnotation) {
              const type = vd.id.typeAnnotation.typeAnnotation
              // E.g. not Thing but could be kinda anything else, which we should switch
              const isIdentifier = type.typeName?.type === 'Identifier'
              const isCorrectType =
                isIdentifier && type.typeName.name === typeName
              if (isCorrectType) {
                return
              }

              context.report({
                messageId: 'needsType',
                node: vd.id,
                data: {
                  name: vd.id.name,
                  typeName,
                },
                *fix(fixer) {
                  // Remove the old type reference - does this need to include a -1 for the ':'?
                  yield fixer.removeRange([type.range[0] - 2, type.range[1]])
                  yield fixer.insertTextAfter(vd.id, `: ${typeName}`)

                  if (!importForThisFile) {
                    yield fixer.insertTextBeforeRange(
                      [0, 0],
                      `import { ${typeName} } from "${thisFileCorrespondingImport}"\n`
                    )
                  } else {
                    const lastImportSpecifier =
                      importForThisFile.specifiers[
                        importForThisFile.specifiers.length - 1
                      ]
                    yield fixer.insertTextAfter(
                      lastImportSpecifier,
                      `, ${typeName}`
                    )
                  }
                },
              })
            }
          }
        })
      },
    }
  },
  name: 'service-type-annotations',
  meta: {
    docs: {
      description:
        'Sets the types on a query/mutation resolver function to the correct type',
      recommended: 'warn',
    },
    messages: {
      needsType:
        'The query/mutation function ({{name}}) needs a type annotation of {{typeName}}.',
    },
    fixable: 'code',
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
})

const capitalizeFirstLetter = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1)
