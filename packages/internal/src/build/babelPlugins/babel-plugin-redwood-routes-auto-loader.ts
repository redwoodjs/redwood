import path from 'path'

import type { PluginObj, types } from '@babel/core'

import {
  importStatementPath,
  processPagesDir,
  getPaths,
  PagesDependency,
  ensurePosixPath,
} from '../../paths'

interface PluginOptions {
  useStaticImports?: boolean
}

const getPathRelativeToSrc = (absolutePath: string) => {
  return `./${path.relative(getPaths().web.src, absolutePath)}`
}

const withRelativeImports = (page: PagesDependency) => {
  return {
    ...page,
    relativeImport: ensurePosixPath(getPathRelativeToSrc(page.importPath)),
  }
}

export default function (
  { types: t }: { types: typeof types },
  { useStaticImports = false }: PluginOptions
): PluginObj {
  let pages = processPagesDir().map(withRelativeImports)

  return {
    name: 'babel-plugin-redwood-routes-auto-loader',
    visitor: {
      // Remove any pages that have been explicitly imported in the Routes file,
      // because when one is present, the user is requesting that the module be
      // included in the main bundle.
      ImportDeclaration(p) {
        if (pages.length === 0) {
          return
        }

        // Remove Page imports in prerender mode (see babel-preset)
        // This is to make sure that all the imported "Page modules" are normal imports
        // and not asynchronous ones.
        if (useStaticImports) {
          // Match import paths, const name could be different
          const userImportPath = importStatementPath(p.node.source?.value)
          const relativePageImportPaths = pages.map((page) => {
            return page.relativeImport
          })

          // When running from the CLI: Babel-plugin-module-resolver will convert
          // For dev/build/prerender: 'src/pages/ExamplePage' -> './pages/ExamplePage'
          // For test: 'src/pages/ExamplePage' -> '/Users/blah/pathToProject/web/src/pages/ExamplePage'

          // Check only relative (dev/build/prerender)  - jest doesn't enter this block
          if (relativePageImportPaths.includes(userImportPath)) {
            p.remove()
          }

          return
        }

        const declaredImports = p.node.specifiers.map(
          (specifier) => specifier.local.name
        )

        pages = pages.filter((dep) => !declaredImports.includes(dep.const))
      },
      Program: {
        enter() {
          pages = processPagesDir().map(withRelativeImports)
        },
        exit(p) {
          if (pages.length === 0) {
            return
          }
          const nodes = []
          // Prepend all imports to the top of the file
          for (const { importName, relativeImport } of pages) {
            // + const <importName> = { name: <importName>, loader: () => import(<relativeImportPath>) }

            nodes.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importName),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('name'),
                      t.stringLiteral(importName)
                    ),
                    t.objectProperty(
                      t.identifier('loader'),
                      t.arrowFunctionExpression(
                        [],
                        t.callExpression(
                          // If useStaticImports, do a synchronous import with require (ssr/prerender)
                          // otherwise do a dynamic import (browser)
                          useStaticImports
                            ? t.identifier('require')
                            : t.identifier('import'),
                          [t.stringLiteral(relativeImport)]
                        )
                      )
                    ),
                  ])
                ),
              ])
            )
          }
          // Insert at the top of the file
          p.node.body.unshift(...nodes)
        },
      },
    },
  }
}
