/**
 * @fileoverview Rule to flag references to non-existent Pages.
 * @author Tom Preston-Werner
 *
 * Check to make sure that all referenced Pages exist in the `/web/src/pages`
 * directory. Thanks to eslint/undef upon which this code is based.
 */
import fs from 'fs'
import path from 'path'

import { flattenDeep } from 'lodash'

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

function processDir(dir, prefix = []) {
  const deps = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  // Iterate over a dir's entries, recursing as necessary into
  // subdirectories.
  entries.forEach((entry) => {
    if (entry.isDirectory()) {
      // Actual JS files reside in a directory of the same name, so let's
      // construct the filename of the actual Page file.
      const testFile = path.join(dir, entry.name, entry.name + '.js')

      if (fs.existsSync(testFile)) {
        // If the Page exists, then construct the dependency object and push it
        // onto the deps array.
        const basename = path.posix.basename(entry.name, '.js')
        const importName = prefix.join() + basename
        const importFile = path.join('src', 'pages', ...prefix, basename)
        deps.push({
          const: importName,
          path: path.join(dir, entry.name),
          importStatement: `import ${importName} from '${importFile}'`,
        })
      } else {
        // If the Page doesn't exist then we are in a directory of Page
        // directories, so let's recurse into it and do the whole thing over
        // again.
        const newPrefix = prefix.concat(entry.name)
        deps.push(processDir(path.join(dir, entry.name), newPrefix))
      }
    }
  })

  // We may have nested arrays because of the recursion, so flatten the deps
  // into a list.
  return flattenDeep(deps)
}

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

    const deps = processDir(path.join(context.getCwd(), 'web', 'src', 'pages'))
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
