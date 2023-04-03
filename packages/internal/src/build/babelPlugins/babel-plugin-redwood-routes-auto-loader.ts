import path from 'path'

import type { PluginObj, types } from '@babel/core'

import {
  importStatementPath,
  processPagesDir,
  getPaths,
  PagesDependency,
  ensurePosixPath,
} from '@redwoodjs/project-config'

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

        const userImportRelativePath = getPathRelativeToSrc(
          importStatementPath(p.node.source?.value)
        )

        const defaultSpecifier = p.node.specifiers.filter((specifiers) =>
          t.isImportDefaultSpecifier(specifiers)
        )[0]

        // Remove Page imports in prerender mode (see babel-preset)
        // The removed imports will be replaced further down in this file
        // with declarations like these:
        // const HomePage = {
        //   name: "HomePage",
        //   loader: () => import("./pages/HomePage/HomePage")
        //   prerenderLoader: () => require("./pages/HomePage/HomePage")
        // };
        // This is to make sure that all the imported "Page modules" are normal
        // imports and not asynchronous ones.
        // Note that jest in a user's project does not enter this block, but our tests do
        if (useStaticImports) {
          // Match import paths, const name could be different

          const pageThatUserImported = pages.find((page) => {
            return (
              page.relativeImport === ensurePosixPath(userImportRelativePath)
            )
          })

          if (pageThatUserImported) {
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

        if (userImportRelativePath && defaultSpecifier) {
          // Remove the page from pages list, if it is already explicitly imported, so that we don't add loaders for these pages.
          // We use the path & defaultSpecifier because the const name could be anything
          pages = pages.filter(
            (page) =>
              !(page.relativeImport === ensurePosixPath(userImportRelativePath))
          )
        }
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

          // Add "import {lazy} from 'react'"
          nodes.unshift(
            t.importDeclaration(
              [t.importSpecifier(t.identifier('lazy'), t.identifier('lazy'))],
              t.stringLiteral('react')
            )
          )
          // Prepend all imports to the top of the file
          for (const { importName, relativeImport } of pages) {
            // + const <importName> = {
            //     name: <importName>,
            //     loader: () => import(/* webpackChunkName: "<importName>" */ <relativeImportPath>)
            //     // prerender
            //     prerenderLoader: () => require(<relativeImportPath>)
            //     // crs
            //     prerenderLoader: () => __webpack_require__(require.resolveWeak(<relativeImportPath>))
            //   }

            const importArgument = t.stringLiteral(relativeImport)

            importArgument.leadingComments = [
              {
                type: 'CommentBlock',
                value: ` webpackChunkName: "${importName}" `,
              },
            ]

            nodes.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importName),
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('name'),
                      t.stringLiteral(importName)
                    ),
                    // loader for dynamic imports (browser)
                    t.objectProperty(
                      t.identifier('loader'),
                      t.arrowFunctionExpression(
                        [],
                        t.callExpression(t.identifier('import'), [
                          importArgument,
                        ])
                      )
                    ),
                    // prerenderLoader for ssr/prerender and first load of
                    // prerendered pages in browser (csr)
                    t.objectProperty(
                      t.identifier('prerenderLoader'),
                      t.arrowFunctionExpression(
                        [],
                        useStaticImports
                          ? t.callExpression(t.identifier('require'), [
                              t.stringLiteral(relativeImport),
                            ])
                          : t.callExpression(
                              t.identifier(
                                // Use __webpack_require__ otherwise all pages will
                                // be bundled
                                '__webpack_require__'
                              ),
                              [
                                t.callExpression(
                                  t.identifier('require.resolveWeak'),
                                  [t.stringLiteral(relativeImport)]
                                ),
                              ]
                            )
                      )
                    ),
                    t.objectProperty(
                      t.identifier('LazyComponent'),
                      t.callExpression(t.identifier('lazy'), [
                        t.arrowFunctionExpression(
                          [],
                          t.callExpression(t.identifier('import'), [
                            t.stringLiteral(relativeImport),
                          ])
                        ),
                      ])
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
