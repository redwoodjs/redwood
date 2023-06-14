// @ts-check

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
        const objectName = node.object.name
        const propertyName = node.property.name

        if (
          objectName === 'process' &&
          propertyName === 'env' &&
          node.computed
        ) {
          context.report({
            message: 'Computed member access for process.env is not allowed.',
            node,
            // fix(fixer) {},
          })
        }
      },
    }
  },
}

export default rule
