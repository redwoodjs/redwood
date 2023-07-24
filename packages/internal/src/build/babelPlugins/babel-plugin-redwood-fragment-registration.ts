// const { gql } = require('graphql')
import type { PluginObj, types } from '@babel/core'

export default function ({ types: t }: { types: typeof types }): PluginObj {
  let nodesToRemove: any[] = []
  let nodesToPrepend: any[] = []
  let nodesToAppend: any[] = []

  return {
    name: 'babel-plugin-redwood-fragment-registration',
    visitor: {
      Program: {
        enter() {
          nodesToRemove = []
          nodesToPrepend = []
          nodesToAppend = []

          const importDeclaration = t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier('fragmentRegistry'),
                t.identifier('fragmentRegistry')
              ),
            ],
            t.stringLiteral('@redwoodjs/web/apollo')
          )

          nodesToPrepend.push(importDeclaration)
        },
        exit(path) {
          for (const n of nodesToRemove) {
            n.remove()
            // console.debug('n', n)
          }
          // Insert at the top of the file
          path.node.body.unshift(...nodesToAppend)
          path.node.body.unshift(...nodesToPrepend)
          // path.replaceWithMultiple(nodesToInsert)
        },
      },
      AssignmentExpression(path) {
        let fragmentName: string
        nodesToRemove.push(path)
        const { left, right } = path.node

        if (right.type === 'ObjectExpression') {
          if (left.type === 'MemberExpression') {
            if (left.object.type === 'Identifier') {
              fragmentName = left.object.name
            }
          }
          if (right.properties) {
            const fragmentAsts = right.properties.map((prop) => {
              if (prop.type === 'ObjectProperty') {
                if (prop.value.type === 'TaggedTemplateExpression') {
                  return {
                    fragmentName,
                    fragmentPrefix:
                      prop.key.type === 'Identifier' ? prop.key.name : '',
                    fragmentTaggedTemplate: prop.value,
                  }
                }
              }
              return
            })

            if (fragmentAsts) {
              fragmentAsts.forEach((fragmentAst) => {
                const fragmentIdentifier = `${fragmentAst?.['fragmentName']}_Fragment_${fragmentAst?.['fragmentPrefix']}`

                console.debug('fragmentAsts', fragmentAsts)
                console.debug('fragmentAsts', fragmentAsts[0])

                console.debug('fragmentName', fragmentName)
                console.debug('fragmentAst', fragmentAst)

                const fragment = t.exportNamedDeclaration(
                  t.variableDeclaration('const', [
                    t.variableDeclarator(
                      t.identifier(fragmentIdentifier),
                      fragmentAst?.['fragmentTaggedTemplate']
                    ),
                  ])
                )

                nodesToAppend.push(fragment)

                // Generate the AST
                const fragmentRegisterCallExpression = t.callExpression(
                  t.memberExpression(
                    t.identifier('fragmentRegistry'),
                    t.identifier('register')
                  ),
                  [t.identifier(fragmentIdentifier)]
                )

                const fragmentRegisterStatement = t.expressionStatement(
                  fragmentRegisterCallExpression
                )

                nodesToAppend.push(fragmentRegisterStatement)
              })
            }
          }
        }
      },
    },
  }
}
