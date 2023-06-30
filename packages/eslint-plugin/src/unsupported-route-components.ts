import { ESLintUtils } from '@typescript-eslint/utils'

const createRule = ESLintUtils.RuleCreator.withoutDocs

function isAllowedElement(name: string) {
  const allowedElements = ['Router', 'Route', 'Set', 'Private']
  return allowedElements.includes(name)
}

export const unsupportedRouteComponents = createRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Find unsupported route components',
      recommended: 'error',
    },
    messages: {
      unexpected:
        'Unexpected JSX element <{{name}}>. Only <Router>, <Route>, <Set> and <Private> are allowed in the Routes file.',
    },
    schema: [], // No additional configuration needed
  },
  defaultOptions: [],
  create(context) {
    return {
      JSXOpeningElement: function (node) {
        let name = ''

        if (node.name.type === 'JSXIdentifier') {
          name = node.name.name
        } else {
          return
        }

        if (!isAllowedElement(name)) {
          context.report({
            node,
            messageId: 'unexpected',
            data: { name },
          })
        }
      },
    }
  },
})
