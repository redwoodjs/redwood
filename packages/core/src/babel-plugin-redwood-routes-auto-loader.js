import path from 'path'

import { getPaths, processPagesDir } from '@redwoodjs/internal'

const WEB_PAGES_DIR = getPaths().web.pages

module.exports = function ({ types: t }) {
  // Process the dir to find all Page dependencies.
  let deps = processPagesDir()

  return {
    visitor: {
      // Remove any deps that have been explicitly declared in the Routes file. When one
      // is present, the user is requesting that the module be included in the main
      // bundle.
      ImportDeclaration(path) {
        const declaredImports = path.node.specifiers.map(
          (specifier) => specifier.local.name
        )
        deps = deps.filter((dep) => !declaredImports.includes(dep.const))
      },
      Program: {
        exit(nodePath) {
          // Prepend all imports to the top of the file
          deps.forEach((dep) => {
            const basename = path.basename(dep.const)
            const importFile = path.join(WEB_PAGES_DIR, basename)

            nodePath.node.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(dep.const),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('name'),
                      t.stringLiteral(dep.const)
                    ),
                    t.objectProperty(
                      t.identifier('loader'),
                      t.arrowFunctionExpression(
                        [],
                        t.callExpression(t.identifier('import'), [
                          t.stringLiteral(importFile),
                        ])
                      )
                    ),
                  ])
                ),
              ])
            )
          })
        },
      },
    },
  }
}
