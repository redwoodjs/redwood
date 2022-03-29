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

/**
 * When running from the CLI: Babel-plugin-module-resolver will convert
 * For dev/build/prerender (forJest == false): 'src/pages/ExamplePage' -> './pages/ExamplePage'
 * For test (forJest == true): 'src/pages/ExamplePage' -> '/Users/blah/pathToProject/web/src/pages/ExamplePage'
 */
const getPathRelativeToSrc = (maybeAbsolutePath: string) => {
  // If the path is already relative
  if (!path.isAbsolute(maybeAbsolutePath)) {
    return maybeAbsolutePath
  }

  return `./${path.relative(getPaths().web.src, maybeAbsolutePath)}`
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
  // @NOTE: This var gets mutated inside the visitors
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
        // But note that jest in a user's project does not enter this block, but our tests do
        if (useStaticImports) {
          // Match import paths, const name could be different
          const userImportPath = getPathRelativeToSrc(
            importStatementPath(p.node.source?.value)
          )

          const pageThatUserImported = pages.find((page) => {
            return page.relativeImport === ensurePosixPath(userImportPath)
          })

          if (pageThatUserImported) {
            const defaultSpecifier = p.node.specifiers.filter((specifiers) =>
              t.isImportDefaultSpecifier(specifiers)
            )[0]

            // Update the import name, with the user's import name
            // So that the JSX name stays consistent
            pageThatUserImported.importName = defaultSpecifier.local.name

            // Remove the default import for the page and leave all the others
            p.node.specifiers = p.node.specifiers.filter(
              (specifier) => !t.isImportDefaultSpecifier(specifier)
            )
          }

          return
        }

        const declaredImports = p.node.specifiers.map(
          (specifier) => specifier.local.name
        )

        // @TODO: I think we need to be more clever than just import name
        pages = pages.filter((page) => !declaredImports.includes(page.const))
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
