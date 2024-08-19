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

  // const author = {
  //   email: 'story.user@email.com',
  //   fullName: 'Story User',
  // }
  const authorDeclaration = j.variableDeclaration('const', [
    j.variableDeclarator(
      j.identifier('author'),
      j.objectExpression([
        j.property(
          'init',
          j.identifier('email'),
          j.literal('story.user@email.com'),
        ),
        j.property('init', j.identifier('fullName'), j.literal('Story User')),
      ]),
    ),
  ])

  // export const Primary: Story = {
  //   render: () => {
  //     return <Author author={author} />
  //   }
  // }
  const primaryIdentifier = j.identifier('Primary')
  primaryIdentifier.typeAnnotation = j.tsTypeAnnotation(
    j.tsTypeReference(j.identifier('Story'), null),
  )

  const primaryWithRender = j.exportNamedDeclaration(
    j.variableDeclaration('const', [
      j.variableDeclarator(
        primaryIdentifier,
        j.objectExpression([
          j.property(
            'init',
            j.identifier('render'),
            j.arrowFunctionExpression(
              [],
              j.blockStatement([
                j.returnStatement(
                  j.jsxElement(
                    j.jsxOpeningElement(
                      j.jsxIdentifier('Author'),
                      [
                        j.jsxAttribute(
                          j.jsxIdentifier('author'),
                          j.jsxExpressionContainer(j.identifier('author')),
                        ),
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
    exportStatement.insertBefore(authorDeclaration)
    exportStatement.replaceWith(primaryWithRender)
  } else {
    throw new Error('Could not find export statement in author story')
  }

  return root.toSource()
}
