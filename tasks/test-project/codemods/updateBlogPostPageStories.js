export default (file, api) => {
  const j = api.jscodeshift
  const root = j(file.source)

  // Find `export const Primary: Story = {}`
  const exportStatement = root.find(j.ExportNamedDeclaration, {
    declaration: {
      type: 'VariableDeclaration',
      declarations: [
        {
          type: 'VariableDeclarator',
          id: {
            type: 'Identifier',
            name: 'Primary',
          },
          init: {
            type: 'ObjectExpression',
            properties: [],
          },
        },
      ],
    },
  })

  // Create the `Primary` identifier
  const primaryIdentifier = j.identifier('Primary')
  // Add the `Story` type annotation
  primaryIdentifier.typeAnnotation = j.tsTypeAnnotation(
    j.tsTypeReference(j.identifier('Story'), null),
  )

  // export const Primary: Story = {
  //   render: (args) => {
  //     return <BlogPostPage id={42} {...args} />
  //   }
  // }
  const primaryWithRender = j.exportNamedDeclaration(
    j.variableDeclaration('const', [
      j.variableDeclarator(
        primaryIdentifier,
        j.objectExpression([
          j.property(
            'init',
            j.identifier('render'),
            j.arrowFunctionExpression(
              [j.identifier('args')],
              j.blockStatement([
                j.returnStatement(
                  j.jsxElement(
                    j.jsxOpeningElement(
                      j.jsxIdentifier('BlogPostPage'),
                      [
                        j.jsxAttribute(
                          j.jsxIdentifier('id'),
                          j.jsxExpressionContainer(j.numericLiteral(42)),
                        ),
                        j.jsxSpreadAttribute(j.identifier('args')),
                      ],
                      true,
                    ),
                    null,
                    [],
                    true,
                  ),
                ),
              ]),
            ),
          ),
        ]),
      ),
    ]),
  )

  if (exportStatement.length > 0) {
    // Replace the empty object export with the object with the `render`
    // property
    exportStatement.replaceWith(primaryWithRender)
  } else {
    throw new Error('Could not find export statement in author story')
  }

  return root.toSource()
}
