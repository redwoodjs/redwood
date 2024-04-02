import type { PluginObj, PluginPass, types } from '@babel/core'

// This extracts the options passed to the graphql function and stores them in a file so they can be imported elsewhere.

const exportVariableName = '__rw_graphqlOptions' as const

function optionsConstNode(
  t: typeof types,
  value:
    | types.ArgumentPlaceholder
    | types.JSXNamespacedName
    | types.SpreadElement
    | types.Expression,
  state: PluginPass,
) {
  if (
    t.isIdentifier(value) ||
    t.isObjectExpression(value) ||
    t.isCallExpression(value) ||
    t.isConditionalExpression(value)
  ) {
    return t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(exportVariableName), value),
      ]),
    )
  } else {
    throw new Error(
      `Unable to parse graphql function options in '${state.file.opts.filename}'`,
    )
  }
}

export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-graphql-options-extract',
    visitor: {
      ExportNamedDeclaration(path, state) {
        const declaration = path.node.declaration
        if (declaration?.type !== 'VariableDeclaration') {
          return
        }

        const declarator = declaration.declarations[0]
        if (declarator?.type !== 'VariableDeclarator') {
          return
        }

        const identifier = declarator.id
        if (identifier?.type !== 'Identifier') {
          return
        }
        if (identifier.name !== 'handler') {
          return
        }

        const init = declarator.init
        if (init?.type !== 'CallExpression') {
          return
        }

        const options = init.arguments[0]
        path.insertBefore(optionsConstNode(t, options, state))
        init.arguments[0] = t.identifier(exportVariableName)
      },
    },
  }
}
