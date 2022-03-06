import type { FileInfo, API, Identifier, ASTNode, ASTPath } from 'jscodeshift'
import core from 'jscodeshift'

function renameTimestamp(
  j: core.JSCodeshift,
  optionsObject: ASTNode | ASTNode[] | ASTPath | ASTPath[]
) {
  j(optionsObject)
    .find(j.ObjectProperty, { key: { name: 'timestamp' } })
    .replaceWith((op) => {
      const currentTimestampOverride = j.objectProperty.from({
        key: j.identifier('currentTimestampOverride'),
        value: op.value.value,
        // @ts-expect-error - comments
        comments: op.value.trailingComments || null,
      })
      return currentTimestampOverride
    })
}

export default function transform(file: FileInfo, api: API) {
  const j = api.jscodeshift
  const ast = j(file.source)

  ast
    .find(j.CallExpression, (callExpression) => {
      const calleeName = (callExpression.callee as Identifier).name

      // Find all calls to
      // `signPayload('timestampSchemeVerifier', ...)`
      // `verifyEvent('timestampSchemeVerifier', ...)`
      // `verifySignature('timestampSchemeVerifier', ...)`
      return (
        (calleeName === 'signPayload' ||
          calleeName === 'verifyEvent' ||
          calleeName === 'verifySignature') &&
        callExpression.arguments[0]?.type === 'StringLiteral' &&
        callExpression.arguments[0]?.value === 'timestampSchemeVerifier'
      )
    })
    .forEach(({ node: callExpression }) => {
      j(callExpression)
        // Find all object properties called `options`
        .find(j.ObjectProperty, { key: { name: 'options' } })
        .forEach(({ value: options }) => {
          // This codemod supports inline options object, like:
          //
          // verifyEvent('timestampSchemeVerifier', {
          //   event,
          //   options: {
          //     timestamp: Date.now() - 60 * 1000, // one minute ago
          //   },
          // })
          //
          // or when the options object is declared elsewhere, like:
          //
          // const verifierOptions = {
          //   timestamp: Date.now(),
          // }
          //
          // verifyEvent('timestampSchemeVerifier', {
          //   event,
          //   options: verifierOptions,
          // })

          // @ts-expect-error - properties
          if (options.value.properties) {
            // inline options object has `properties`
            renameTimestamp(j, options.value)
          } else {
            // An options object referenced by name has a `name` value
            // @ts-expect-error - name
            ast.findVariableDeclarators(options.value.name).forEach((n) => {
              renameTimestamp(j, n.node)
            })
          }
        })
    })

  return ast.toSource({ trailingComma: true, quote: 'single' })
}
