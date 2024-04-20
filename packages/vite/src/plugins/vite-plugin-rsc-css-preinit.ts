import fs from 'fs'
import path from 'path'

import generate from '@babel/generator'
import { parse as babelParse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { Plugin } from 'vite'
import { normalizePath } from 'vite'

import { getPaths } from '@redwoodjs/project-config'

export function generateCssMapping(clientBuildManifest: any) {
  const clientBuildManifestCss = new Map<string, string[]>()
  const lookupCssAssets = (id: string): string[] => {
    const assets: string[] = []
    const asset = clientBuildManifest[id]
    if (!asset) {
      return assets
    }
    if (asset.css) {
      assets.push(...asset.css)
    }
    if (asset.imports) {
      for (const importId of asset.imports) {
        assets.push(...lookupCssAssets(importId))
      }
    }
    return assets
  }
  for (const key of Object.keys(clientBuildManifest)) {
    clientBuildManifestCss.set(key, lookupCssAssets(key))
  }
  return clientBuildManifestCss
}

export function splitClientAndServerComponents(
  clientEntryFiles: Record<string, string>,
  componentImportMap: Map<string, string[]>,
) {
  const serverComponentImports = new Map<string, string[]>()
  const clientComponentImports = new Map<string, string[]>()
  const clientComponentIds = Object.values(clientEntryFiles)
  for (const [key, value] of componentImportMap.entries()) {
    if (clientComponentIds.includes(key)) {
      clientComponentImports.set(key, value)
    } else {
      serverComponentImports.set(key, value)
    }
  }
  return { serverComponentImports, clientComponentImports }
}

export function generateServerComponentClientComponentMapping(
  serverComponentImports: Map<string, string[]>,
  clientComponentImports: Map<string, string[]>,
) {
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
      if (clientComponentImports.has(importId)) {
        clientImports.add(importId)
      }
      gatherClientImports(importId, clientImports)
    }
    serverComponentClientImportIds.set(
      serverComponentId,
      Array.from(clientImports),
    )
  }
  return serverComponentClientImportIds
}

export function rscCssPreinitPlugin(
  clientEntryFiles: Record<string, string>,
  componentImportMap: Map<string, string[]>,
): Plugin {
  const webSrc = getPaths().web.src

  // This plugin is build only and we expect the client build manifest to be
  // available at this point. We use it to find the correct css assets names
  const manifestPath = path.join(
    getPaths().web.distClient,
    'client-build-manifest.json',
  )
  const clientBuildManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

  // We generate a mapping of all the css assets that a client build manifest
  // entry contains (looking deep into the tree of entries)
  const clientBuildManifestCss = generateCssMapping(clientBuildManifest)

  // We filter to have individual maps for server components and client
  // components
  const { serverComponentImports, clientComponentImports } =
    splitClientAndServerComponents(clientEntryFiles, componentImportMap)

  // We generate a mapping of server components to all the client components
  // that they import (directly or indirectly)
  const serverComponentClientImportIds =
    generateServerComponentClientComponentMapping(
      serverComponentImports,
      clientComponentImports,
    )

  return {
    name: 'rsc-css-preinit',
    apply: 'build',
    transform: async function (code, id) {
      // We only care about code in the project itself
      if (!id.startsWith(normalizePath(webSrc))) {
        return null
      }

      // We only care about server components
      if (!serverComponentImports.has(id)) {
        return null
      }

      // Get the client components this server component imports (directly or
      // indirectly)
      const clientImportIds = serverComponentClientImportIds.get(id) ?? []
      if (clientImportIds.length === 0) {
        return null
      }

      // Extract all the CSS asset names from all the client components that
      // this server component imports
      const assetNames = new Set<string>()
      for (const clientImportId of clientImportIds) {
        const shortName = path.basename(clientImportId)
        const longName = clientImportId.substring(webSrc.length + 1)
        const entries =
          clientBuildManifestCss.get(shortName) ??
          clientBuildManifestCss.get(longName) ??
          []
        for (const entry of entries) {
          assetNames.add(entry)
        }
      }

      if (assetNames.size === 0) {
        return null
      }

      // Analyze the AST to get all the components that we have to insert pre-init
      // calls into
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

      // TODO: Confirm this is a react component by looking for `jsxs` in the AST
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
                          t.objectProperty(
                            t.identifier('precedence'),
                            t.stringLiteral('medium'),
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
