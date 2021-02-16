import type { PluginObj, types } from '@babel/core'

import { processPagesDir } from '@redwoodjs/internal'
import { RWProject } from '@redwoodjs/structure'

import { generateTypeDef, generateTypeDefIndex } from './generateTypes'

interface PluginOptions {
  project: RWProject
  useStaticImports?: boolean
}

export default function (
  { types: t }: { types: typeof types },
  { project, useStaticImports = false }: PluginOptions
): PluginObj {
  let pages = processPagesDir()
  const rwPageImportPaths = pages.map((page) => page.importPath)

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
          const userImportPath = p.node.source?.value
          // FIXME:
          // `userImportPath` is `src/pages/HomePage/HomePage`
          // `rwPageImportsPaths` are absolute, therefore the test to remove them will never run, see:
          // https://github.com/redwoodjs/redwood/blob/82e87f84cb10005ca331dd3d8f6569f4c76615d7/packages/core/src/babelPlugins/__tests__/__fixtures__/routes-auto-loader-static-imports/routes-with-some-imports/output.js#L26-L27
          // [
          //   '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/admin/EditUserPage/EditUserPage',
          //   '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/FatalErrorPage/FatalErrorPage',
          //   '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/HomePage/HomePage',
          //   '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/NotFoundPage/NotFoundPage',
          //   '/Users/peterp/gh/redwoodjs/redwood/__fixtures__/example-todo-main/web/src/pages/TypeScriptPage/TypeScriptPage'
          // ]

          if (rwPageImportPaths.includes(userImportPath)) {
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
          pages = processPagesDir()

          // Produces:
          // routes.home: () => "/home"
          // routes.aboutUs: () => "/about-us"
          const availableRoutes = project
            .getRouter()
            .routes.filter((r) => !r.isNotFound)
            .map((r) => `${r.name}: () => "${r.path}"`)

          const pageImports = pages.map(
            (page) => `import type ${page.const}Type from '${page.importPath}'`
          )
          const pageGlobals = pages.map(
            (page) => `const ${page.const}: typeof ${page.const}Type`
          )

          const typeDefContent = `
            declare module '@redwoodjs/router' {
              interface AvailableRoutes {
                ${availableRoutes.join('\n    ')}
              }
            }

            ${pageImports.join('\n')}

            declare global {
              ${pageGlobals.join('\n  ')}
            }
            `
            .split('\n')
            .slice(1)
            .map((line) => line.replace('            ', ''))
            .join('\n')

          generateTypeDef('routes.d.ts', typeDefContent)
          generateTypeDefIndex()
        },
        exit(p) {
          if (pages.length === 0) {
            return
          }
          const nodes = []
          // Prepend all imports to the top of the file
          for (const { importName, importPath } of pages) {
            // + const <importName> = { name: <importName>, loader: () => import(<importPath>) }
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
                          [t.stringLiteral(importPath)]
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
