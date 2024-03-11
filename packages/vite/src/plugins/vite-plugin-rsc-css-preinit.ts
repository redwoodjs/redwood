import fs from 'fs'
import path from 'path'

import generate from '@babel/generator'
import { parse as babelParse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { Plugin } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export function rscCssPreinitPlugin(
  _cssImportMap: Map<string, string[]>,
  componentImportMap: Map<string, string[]>,
): Plugin {
  const webSrc = getPaths().web.src

  // Filter to only server components
  const clientBuildManifest = JSON.parse(
    fs.readFileSync(
      path.join(getPaths().web.distClient, 'client-build-manifest.json'),
      'utf-8',
    ),
  )

  // Filter to only server components
  const serverComponentImportMap = new Map<string, string[]>()
  for (const [key, value] of componentImportMap.entries()) {
    const shortName = path.basename(key)
    const longName = path.join(webSrc, key)
    if (clientBuildManifest[shortName] || clientBuildManifest[longName]) {
      continue
    }
    serverComponentImportMap.set(key, value)
  }

  return {
    name: 'rsc-css-preinit',
    transform: async function (code, id) {
      // We only care about code in the project itself
      if (!id.startsWith(webSrc)) {
        return null
      }

      // Get a list of components this server component imports
      const componentImportIds = serverComponentImportMap.get(id) ?? []
      if (componentImportIds.length === 0) {
        return null
      }

      // Filter to only client components
      const clientImportIds = []
      for (const componentImportId of componentImportIds) {
        const shortName = path.basename(componentImportId)
        const longName = componentImportId.substring(webSrc.length + 1)

        if (clientBuildManifest[shortName] || clientBuildManifest[longName]) {
          clientImportIds.push(componentImportId)
        }
      }
      if (clientImportIds.length === 0) {
        return null
      }

      // Map from full vite ID to asset name from client build manifest
      const assetNames: string[] = []
      for (const clientImportId of clientImportIds) {
        const shortName = path.basename(clientImportId)
        const longName = clientImportId.substring(webSrc.length + 1)

        const cssAssets =
          (clientBuildManifest[shortName]?.css ||
            clientBuildManifest[longName]?.css) ??
          []

        assetNames.push(...cssAssets)

        // TODO: I thought we needed to do something like this, but it seems we don't
        // const cssImports = cssImportMap.get(clientImportId) ?? []
        // if (cssImports.length === 0) {
        //   continue
        // }

        // for (const cssImport of cssImports) {
        //   const shortName = path.basename(cssImport)
        //   const longName = cssImport.substring(webSrc.length + 1)

        //   const assetName =
        //     clientBuildManifest[shortName] || clientBuildManifest[longName]
        //   if (!assetName) {
        //     throw new Error(`Could not find asset name for ${cssImport}`)
        //   }

        //   assetNames.push(assetName.file)
        // }
      }

      // AST to get all the components
      const ext = path.extname(id)

      const plugins = []
      if (ext === '.jsx') {
        plugins.push('jsx')
      }
      const ast = babelParse(code, {
        sourceType: 'unambiguous',
        // @ts-expect-error TODO fix me
        plugins,
      })

      const namedExportNames: string[] = []
      traverse(ast, {
        ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
          const declaration = path.node.declaration
          if (t.isIdentifier(declaration)) {
            namedExportNames.push(declaration.name)
          }
        },
      })

      ast.program.body.unshift(
        t.importDeclaration(
          [t.importSpecifier(t.identifier('preinit'), t.identifier('preinit'))],
          t.stringLiteral('react-dom'),
        ),
      )

      traverse(ast, {
        VariableDeclaration(path: NodePath<t.VariableDeclaration>) {
          const declaration = path.node.declarations[0]
          if (
            t.isVariableDeclarator(declaration) &&
            t.isIdentifier(declaration.id) &&
            namedExportNames.includes(declaration.id.name)
          ) {
            if (t.isArrowFunctionExpression(declaration.init)) {
              const body = declaration.init.body
              if (t.isBlockStatement(body)) {
                for (const assetName of assetNames) {
                  body.body.unshift(
                    t.expressionStatement(
                      t.callExpression(t.identifier('preinit'), [
                        t.stringLiteral(assetName),
                        t.objectExpression([
                          t.objectProperty(
                            t.identifier('as'),
                            t.stringLiteral('style'),
                          ),
                        ]),
                      ]),
                    ),
                  )
                }
              }
            }
          }
        },
      })

      return generate(ast).code
    },
  }
}
