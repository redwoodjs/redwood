import * as nodejsPath from 'path'

import type { PluginObj, types } from '@babel/core'

import { getBaseDirFromFile } from '../../paths'

// This wraps user code within opentelemetry spans to provide greater ease in trace analysis.

// TODO: Don't wrap EVERYTHING, be smarter and name them appropriately so they are not all redwoodjs:service:[FunctionName]

export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-otel-wrapping',
    visitor: {
      Program(path) {
        // console.log(JSON.stringify(state.file.opts))
        path.node.body.unshift(
          t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier('opentelemetry'))],
            t.stringLiteral('@opentelemetry/api')
          )
        )
      },
      ExportNamedDeclaration(path, state) {
        if (
          path.node.declaration?.type === 'VariableDeclaration' &&
          path.node.declaration.declarations[0].init?.type ===
            'ArrowFunctionExpression'
        ) {
          const originalFunc = path.node.declaration.declarations[0].init
          const originalFuncId =
            path.node.declaration.declarations[0].id.type === 'Identifier'
              ? path.node.declaration.declarations[0].id.name
              : '?'

          const originalFuncArguments: (
            | types.ArgumentPlaceholder
            | types.JSXNamespacedName
            | types.SpreadElement
            | types.Expression
          )[] = []
          for (const param of originalFunc.params) {
            switch (param.type) {
              case 'ArrayPattern':
                // TODO: Implement me
                break
              case 'AssignmentPattern':
                // TODO: Implement me
                break
              case 'Identifier':
                originalFuncArguments.push(param)
                // TODO: Implement me
                break
              case 'ObjectPattern':
                // TODO: Is this correct?
                originalFuncArguments.push(
                  t.objectExpression(
                    param.properties.filter(
                      (p) => p.type === 'ObjectProperty'
                    ) as types.ObjectProperty[]
                  )
                )
                break
              case 'RestElement':
                // TODO: Implement me
                break
            }
          }

          const filename = state.file.opts.filename
          const filenameOffset = filename
            ? getBaseDirFromFile(filename).length + 9 // 9 is the length of '/api/src/'
            : 0
          const apiFolder = filename
            ? filename.substring(
                filenameOffset,
                filename.substring(filenameOffset).indexOf(nodejsPath.sep) +
                  filenameOffset
              )
            : '?'

          const activeSpanBlock = t.callExpression(
            t.memberExpression(
              t.identifier('tracer'),
              t.identifier('startActiveSpan')
            ),
            [
              t.stringLiteral(`redwoodjs:api:${apiFolder}:${originalFuncId}`),
              t.arrowFunctionExpression(
                [t.identifier('span')],
                t.blockStatement([
                  t.tryStatement(
                    t.blockStatement([
                      t.variableDeclaration('const', [
                        t.variableDeclarator(
                          t.identifier('innerResult'),
                          originalFunc.async
                            ? t.awaitExpression(
                                t.callExpression(
                                  t.identifier(`_${originalFuncId}`),
                                  originalFuncArguments
                                )
                              )
                            : t.callExpression(
                                t.identifier(`_${originalFuncId}`),
                                originalFuncArguments
                              )
                        ),
                      ]),
                      t.expressionStatement(
                        t.callExpression(
                          t.memberExpression(
                            t.identifier('span'),
                            t.identifier('setAttribute')
                          ),
                          [
                            t.stringLiteral('code.function'),
                            t.stringLiteral(originalFuncId),
                          ]
                        )
                      ),
                      t.expressionStatement(
                        t.callExpression(
                          t.memberExpression(
                            t.identifier('span'),
                            t.identifier('setAttribute')
                          ),
                          [
                            t.stringLiteral('code.filepath'),
                            t.stringLiteral(state.file.opts.filename || '?'),
                          ]
                        )
                      ),
                      t.expressionStatement(
                        t.callExpression(
                          t.memberExpression(
                            t.identifier('span'),
                            t.identifier('end')
                          ),
                          []
                        )
                      ),
                      t.returnStatement(t.identifier('innerResult')),
                    ]),
                    t.catchClause(
                      t.identifier('error'),
                      t.blockStatement([
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('span'),
                              t.identifier('recordException')
                            ),
                            [t.identifier('error')]
                          )
                        ),
                        t.expressionStatement(
                          t.callExpression(
                            t.memberExpression(
                              t.identifier('span'),
                              t.identifier('end')
                            ),
                            []
                          )
                        ),
                        t.throwStatement(t.identifier('error')),
                      ])
                    )
                  ),
                ]),
                originalFunc.async
              ),
            ]
          )

          const wrapper = t.arrowFunctionExpression(
            originalFunc.params,
            t.blockStatement(
              [
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier(`_${originalFuncId}`),
                    originalFunc
                  ),
                ]),
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier('tracer'),
                    t.callExpression(
                      t.memberExpression(
                        t.memberExpression(
                          t.identifier('opentelemetry'),
                          t.identifier('trace')
                        ),
                        t.identifier('getTracer')
                      ),
                      [t.stringLiteral('redwoodjs')]
                    )
                  ),
                ]),
                t.variableDeclaration('const', [
                  t.variableDeclarator(
                    t.identifier('result'),
                    originalFunc.async
                      ? t.awaitExpression(activeSpanBlock)
                      : activeSpanBlock
                  ),
                ]),
                t.returnStatement(t.identifier('result')),
              ],
              originalFunc.body.type === 'BlockStatement'
                ? originalFunc.body.directives
                : undefined
            ),
            originalFunc.async
          )

          path.node.declaration.declarations[0].init = wrapper
        }
      },
    },
  }
}
