import type { FileInfo, API, ObjectExpression } from 'jscodeshift'

const newReturn = `userWithoutPrivateMetadata`
const destructureStatement = `const { privateMetadata, ...${newReturn} } = decoded`

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  // Insert `const { privateMetadata, ...userWithoutPrivateMetadata } = decoded` after `const { roles } = parseJWT({ decoded })`
  //
  // So, before...
  //
  // ```ts
  // const { roles } = parseJWT({ decoded })
  // ```
  //
  // and after...
  //
  // ```ts
  // const { roles } = parseJWT({ decoded })
  //
  // const { privateMetadata, ...userWithoutPrivateMetadata } = decoded
  // ```
  const parseJWTStatement = ast.find(j.VariableDeclaration, {
    declarations: [
      {
        type: 'VariableDeclarator',
        init: {
          type: 'CallExpression',
          callee: {
            name: 'parseJWT',
          },
        },
      },
    ],
  })

  parseJWTStatement.insertAfter(destructureStatement)

  // Swap `decoded` with `userWithoutPrivateMetadata` in the two return statements
  ast
    .find(j.ReturnStatement, {
      argument: {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'SpreadElement',
            argument: {
              name: 'decoded',
            },
          },
        ],
      },
    })
    .replaceWith((path) => {
      const properties = (
        path.value.argument as ObjectExpression
      ).properties.filter(
        (property) =>
          property.type !== 'SpreadElement' && property.name !== 'decoded',
      )

      properties.push(j.spreadElement(j.identifier(newReturn)))

      return j.returnStatement(j.objectExpression(properties))
    })

  return ast.toSource({
    trailingComma: true,
    quote: 'single',
    lineTerminator: '\n',
  })
}
