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
  cssImportMap: Map<string, string[]>,
  componentImportMap: Map<string, string[]>,
): Plugin {
  const webSrc = getPaths().web.src

  // TODO: How will we do this in dev?
  const clientBuildManifest = JSON.parse(
    fs.readFileSync(
      path.join(getPaths().web.distClient, 'client-build-manifest.json'),
      'utf-8',
    ),
  )

  // Filter to server components and client components
  const serverComponentImports = new Map<string, string[]>()
  const clientComponentImports = new Map<string, string[]>()
  for (const [key, value] of componentImportMap.entries()) {
    const shortName = path.basename(key)
    const longName = key.substring(webSrc.length + 1)
    if (clientBuildManifest[shortName] || clientBuildManifest[longName]) {
      clientComponentImports.set(key, value)
    } else {
      serverComponentImports.set(key, value)
    }
  }

  // Map server component to complete client import list
  const serverComponentClientImportIds = new Map<string, string[]>()
  const gatherClientImports = (
    id: string,
    clientImports: Set<string>,
  ): void => {
    const imports = clientComponentImports.get(id) ?? []
    for (const importId of imports) {
      if (!clientImports.has(importId)) {
        clientImports.add(importId)
        gatherClientImports(importId, clientImports)
      }
    }
  }
  for (const serverComponentId of serverComponentImports.keys()) {
    const clientImports = new Set<string>()
    const topLevelClientImports =
      serverComponentImports.get(serverComponentId) ?? []
    for (const importId of topLevelClientImports) {
      gatherClientImports(importId, clientImports)
    }
    serverComponentClientImportIds.set(
      serverComponentId,
      Array.from(clientImports),
    )
  }

  return {
    name: 'rsc-css-preinit',
    apply: 'build',
    transform: async function (code, id) {
      // We only care about code in the project itself
      if (!id.startsWith(webSrc)) {
        return null
      }

      // We only care about server components
      if (!serverComponentImports.has(id)) {
        return null
      }

      // Filter to only client components
      const clientImportIds = serverComponentClientImportIds.get(id) ?? []
      if (clientImportIds.length === 0) {
        return null
      }

      // Map from full vite ID to asset name from client build manifest
      // TODO: assetNames had to be a set because we were getting duplicates but this is because
      // i'm being an idiot somewhere before this
      const assetNames = new Set<string>()
      for (const clientImportId of clientImportIds) {
        const cssImports = cssImportMap.get(clientImportId) ?? []
        if (clientImportId.endsWith('.css')) {
          cssImports.push(clientImportId)
        }

        if (cssImports.length === 0) {
          continue
        }

        for (const cssImport of cssImports) {
          const shortName = path.basename(cssImport)
          const longName = cssImport.substring(webSrc.length + 1)

          const assetName =
            clientBuildManifest[shortName] || clientBuildManifest[longName]
          if (!assetName) {
            throw new Error(`Could not find asset name for ${cssImport}`)
          }

          assetNames.add(assetName.file)
        }
      }

      // If no child components have CSS, we don't need to do anything
      if (assetNames.size === 0) {
        return null
      }

      // Analyse the AST to get all the components that we have to insert preinit calls into
      // Note: This AST part is likely not covering every possible case
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

      // Gather a list of the names of exported components
      const namedExportNames: string[] = []
      traverse(ast, {
        ExportDefaultDeclaration(path: NodePath<t.ExportDefaultDeclaration>) {
          const declaration = path.node.declaration
          if (t.isIdentifier(declaration)) {
            namedExportNames.push(declaration.name)
          }
        },
      })

      // Insert: import { preinit } from 'react-dom'
      ast.program.body.unshift(
        t.importDeclaration(
          [t.importSpecifier(t.identifier('preinit'), t.identifier('preinit'))],
          t.stringLiteral('react-dom'),
        ),
      )

      // For each named export, insert a preinit call for each asset that it will
      // eventually need for all it's child client components
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

      // Just for debugging/verbose logging
      console.log(
        'css-preinit:',
        id.substring(webSrc.length + 1),
        'x' + assetNames.size,
        '(' + Array.from(assetNames).join(', ') + ')',
      )

      return generate(ast).code
    },
  }
}
