import type { PluginObj, types } from '@babel/core'

import { processPagesDir } from '@redwoodjs/internal'
import { RWProject } from '@redwoodjs/structure'

import { generateTypeDef, generateTypeDefIndex } from './generateTypes'

interface PluginOptions {
  project: RWProject
}

export default function (
  { types: t }: { types: typeof types },
  { project }: PluginOptions
): PluginObj {
  let pages = processPagesDir()

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
                ${availableRoutes.join('\n')}
              }
            }

            ${pageImports.join('\n')}
            declare global {
              ${pageGlobals.join('\n')}
            }
          `

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
                        t.callExpression(t.identifier('import'), [
                          t.stringLiteral(importPath),
                        ])
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
