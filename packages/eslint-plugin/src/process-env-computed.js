// @ts-check

/**
 * @param {any} node AST node to check
 * @return {node is import('estree').Identifier}
 */
function isIdentifier(node) {
  return node.type === 'Identifier'
}

/**
 * @param {any} node AST node to check
 * @return {node is import('estree').MemberExpression}
 */
function isMemberExpression(node) {
  return node.type === 'MemberExpression'
}

function hasName(node, name) {
  return isIdentifier(node) && node.name === name
}

function isProcessEnv(node) {
  return (
    isMemberExpression(node) &&
    hasName(node.object, 'process') &&
    hasName(node.property, 'env')
  )
}

/** @type import('eslint').Rule.RuleModule */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow computed member access on process.env',
    },
    // fixable: 'code',
    schema: [], // No additional configuration needed
  },
  create(context) {
    return {
      MemberExpression: function (node) {
        if (isProcessEnv(node.object) && node.computed) {
          context.report({
            message: 'Computed member access on process.env is not allowed.',
            node,
            // fix(fixer) {},
          })
        }
      },
    }
  },
}

module.exports = rule
