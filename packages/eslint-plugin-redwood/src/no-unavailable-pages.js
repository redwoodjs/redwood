/**
 * @fileoverview Rule to flag references to non-existent Pages.
 * @author Tom Preston-Werner
 *
 * Check to make sure that all referenced Pages exist in the `/web/src/pages`
 * directory. Thanks to eslint/undef upon which this code is based.
 */
import { processPagesDir } from '@redwoodjs/core'

/**
 * Checks if the given node is the argument of a typeof operator.
 * @param {ASTNode} node The AST node being checked.
 * @returns {boolean} Whether or not the node is the argument of a typeof operator.
 */
function hasTypeOfOperator(node) {
  const parent = node.parent

  return parent.type === 'UnaryExpression' && parent.operator === 'typeof'
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

export default {
  meta: {
    type: 'problem',

    docs: {
      description: 'disallow the use of non-existent Pages in Routes file',
      category: 'Variables',
      recommended: true,
    },

    schema: [
      {
        type: 'object',
        properties: {
          typeof: {
            type: 'boolean',
            default: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      undef: "'{{name}}' can not be found in '/web/src/pages'.",
    },
  },

  create(context) {
    const options = context.options[0]
    const considerTypeOf = (options && options.typeof === true) || false

    const deps = processPagesDir()
    const pageConsts = deps.map((dep) => dep.const)

    return {
      'Program:exit'(/* node */) {
        const globalScope = context.getScope()

        globalScope.through.forEach((ref) => {
          const identifier = ref.identifier

          if (!considerTypeOf && hasTypeOfOperator(identifier)) {
            return
          }

          if (!pageConsts.includes(identifier.name)) {
            context.report({
              node: identifier,
              messageId: 'undef',
              data: identifier,
            })
          }
        })
      },
    }
  },
}
