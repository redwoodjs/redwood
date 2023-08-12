// import * as nodejsPath from 'path'

import path from 'path'

import type { NodePath, PluginObj, types } from '@babel/core'

import { getPaths } from '@redwoodjs/project-config'

// This extracts the options passed to the graphql function and stores them in a file so they can be imported elsewhere.

const exportVariableName = '__redwoodGraphqlOptionsExtract' as const

function optionsExportNode(
  t: typeof types,
  value: types.Expression | null | undefined
) {
  return t.exportNamedDeclaration(
    t.variableDeclaration('const', [
      t.variableDeclarator(t.identifier(exportVariableName), value),
    ])
  )
}

export default function ({ types: t }: { types: typeof types }): PluginObj {
  const graphqlFunctionFilename = path.join(getPaths().api.functions, 'graphql')

  return {
    name: 'babel-plugin-redwood-graphql-options-extract',
    visitor: {
      Program(path, state) {
        // TODO: Just have this plugin run on the graphql function file instead of checking the filename here
        if (
          state.file.opts.filename !== `${graphqlFunctionFilename}.ts` &&
          state.file.opts.filename !== `${graphqlFunctionFilename}.js`
        ) {
          return
        }

        // Find the "handler" export
        let handlerExportDeclaration = undefined
        let handlerVariableDeclarator = undefined
        for (let i = 0; i < path.node.body.length; i++) {
          const node = path.node.body[i]
          if (
            t.isExportNamedDeclaration(node) &&
            t.isVariableDeclaration(node.declaration) &&
            node.declaration.declarations.length >= 0 &&
            t.isVariableDeclarator(node.declaration.declarations[0]) &&
            t.isIdentifier(node.declaration.declarations[0].id) &&
            node.declaration.declarations[0].id.name === 'handler'
          ) {
            handlerExportDeclaration = path.get(
              `body.${i}`
            ) as NodePath<types.ExportNamedDeclaration>
            handlerVariableDeclarator = node.declaration.declarations[0]
            break
          }
        }

        // There was no handler export, so we'll just export undefined for the graphql options
        if (handlerExportDeclaration === undefined) {
          path.pushContainer(
            'body',
            optionsExportNode(t, t.identifier('undefined'))
          )
          return
        }

        // This should never happen, but just in case
        if (handlerVariableDeclarator === undefined) {
          path.pushContainer(
            'body',
            optionsExportNode(t, t.identifier('undefined'))
          )
          return
        }

        // There was a handler export, so we'll export the graphql options
        // We (this babel plugin) only support directly exporting the call expression
        if (!t.isCallExpression(handlerVariableDeclarator.init)) {
          path.pushContainer(
            'body',
            optionsExportNode(t, t.identifier('undefined'))
          )
          return
        }

        // Just be sure that the argument is what we expect
        if (handlerVariableDeclarator.init.arguments.length !== 1) {
          path.pushContainer(
            'body',
            optionsExportNode(t, t.identifier('undefined'))
          )
          return
        }
        if (
          !t.isObjectExpression(handlerVariableDeclarator.init.arguments[0])
        ) {
          path.pushContainer(
            'body',
            optionsExportNode(t, t.identifier('undefined'))
          )
          return
        }

        // We have a valid options object, so let's export it so we can import it elsewhere
        handlerExportDeclaration.insertBefore(
          optionsExportNode(t, handlerVariableDeclarator.init.arguments[0])
        )
        // Use this exported variable rather than have the options object declared twice
        handlerVariableDeclarator.init.arguments[0] =
          t.identifier(exportVariableName)
      },
    },
  }
}
