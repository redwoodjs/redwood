import type { Rule } from 'eslint'
import type { Identifier, MemberExpression } from 'estree'

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

function isTestFile(filename: string) {
  return (
    filename.endsWith('.test.ts') ||
    filename.endsWith('.test.js') ||
    filename.endsWith('.test.tsx') ||
    filename.endsWith('.test.jsx') ||
    filename.endsWith('.test.mts') ||
    filename.endsWith('.test.mjs') ||
    filename.endsWith('.test.cjs') ||
    filename.endsWith('.spec.ts') ||
    filename.endsWith('.spec.js') ||
    filename.endsWith('.spec.tsx') ||
    filename.endsWith('.spec.jsx') ||
    filename.endsWith('.spec.mts') ||
    filename.endsWith('.spec.mjs') ||
    filename.endsWith('.spec.cjs') ||
    filename.includes('/__tests__/')
  )
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
        if (
          isProcessEnv(node.object) &&
          node.computed &&
          !isTestFile(context.filename)
        ) {
          context.report({
            message:
              'Accessing process.env via array syntax will break in production. Use dot notation e.g. process.env.MY_ENV_VAR instead',
            node,
            // fix(fixer) {},
          })
        }
      },
    }
  },
}
