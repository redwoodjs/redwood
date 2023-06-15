import { Rule } from 'eslint'
import { Identifier, MemberExpression } from 'estree'

function isProcessEnv(node: unknown) {
  return (
    isMemberExpression(node) &&
    hasName(node.object, 'process') &&
    hasName(node.property, 'env')
  )
}

function isIdentifier(node: unknown): node is Identifier {
  return (
    typeof node !== 'undefined' && (node as Identifier).type === 'Identifier'
  )
}

function isMemberExpression(node: unknown): node is MemberExpression {
  return (
    typeof node !== 'undefined' &&
    (node as MemberExpression).type === 'MemberExpression'
  )
}

function hasName(node: unknown, name: string) {
  return isIdentifier(node) && node.name === name
}

export const processEnvComputedRule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Find computed member access on process.env',
    },
    // fixable: 'code',
    schema: [], // No additional configuration needed
  },
  create(context) {
    return {
      MemberExpression: function (node) {
        if (isProcessEnv(node.object) && node.computed) {
          console.log('eslint rule filename', context.filename)
          context.report({
            message:
              'Computed member access on process.env does not work in production environments.',
            node,
            // fix(fixer) {},
          })
        }
      },
    }
  },
}
