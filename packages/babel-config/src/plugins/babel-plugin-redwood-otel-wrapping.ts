import * as nodejsPath from 'path'

import type { PluginObj, types } from '@babel/core'

import { getBaseDirFromFile } from '@redwoodjs/project-config'

// This wraps user code within opentelemetry spans to provide greater ease in trace analysis.

export default function ({ types: t }: { types: typeof types }): PluginObj {
  return {
    name: 'babel-plugin-redwood-otel-wrapping',
    visitor: {
      Program(path) {
        // Only import if it isn't already imported in the way we need it
        // TODO: Check for ImportNamespaceSpecifier like "import * as opentelemetry from '@opentelemetry/api'"
        // TODO: Consider just checking for the import name "opentelemetry" and don't consider the source
        const importDeclarations = path.node.body.filter(
          (node) => node.type === 'ImportDeclaration'
        ) as types.ImportDeclaration[]
        const requiredOpenTelemetryImportExists = importDeclarations.some(
          (importDeclaration) => {
            if (importDeclaration.source.value !== '@opentelemetry/api') {
              return false
            }
            if (
              importDeclaration.specifiers[0].type !== 'ImportDefaultSpecifier'
            ) {
              return false
            }
            if (
              importDeclaration.specifiers[0].local.name === 'opentelemetry'
            ) {
              return true
            }
            return false
          }
        )
        if (!requiredOpenTelemetryImportExists) {
          path.node.body.unshift(
            t.importDeclaration(
              [t.importDefaultSpecifier(t.identifier('opentelemetry'))],
              t.stringLiteral('@opentelemetry/api')
            )
          )
        }
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
                              t.identifier('setStatus')
                            ),
                            [
                              t.objectExpression([
                                t.objectProperty(
                                  t.identifier('code'),
                                  t.numericLiteral(2)
                                ),
                                t.objectProperty(
                                  t.identifier('message'),
                                  t.logicalExpression(
                                    '??',
                                    t.optionalMemberExpression(
                                      t.optionalCallExpression(
                                        t.optionalMemberExpression(
                                          t.optionalMemberExpression(
                                            t.identifier('error'),
                                            t.identifier('message'),
                                            false,
                                            true
                                          ),
                                          t.identifier('split'),
                                          false,
                                          true
                                        ),
                                        [t.stringLiteral('\n')],
                                        false
                                      ),
                                      t.numericLiteral(0),
                                      true,
                                      false
                                    ),
                                    t.optionalMemberExpression(
                                      t.optionalCallExpression(
                                        t.optionalMemberExpression(
                                          t.optionalCallExpression(
                                            t.optionalMemberExpression(
                                              t.identifier('error'),
                                              t.identifier('toString'),
                                              false,
                                              true
                                            ),
                                            [],
                                            false
                                          ),
                                          t.identifier('split'),
                                          false,
                                          true
                                        ),
                                        [t.stringLiteral('\n')],
                                        false
                                      ),
                                      t.numericLiteral(0),
                                      true,
                                      false
                                    )
                                  )
                                ),
                              ]),
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
