import { extname, basename, join } from 'path'

import type { PluginObj, types, NodePath } from '@babel/core'

import { getPaths } from '@redwoodjs/internal'

import { convertToDataUrl } from './utils'

const defaultOptions = {
  // This list of extensions matches config for file-loader in
  // packages/core/config/webpack.common.js
  extensions: [
    '.ico',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.eot',
    '.otf',
    '.webp',
    '.ttf',
    '.woff',
    '.woff2',
    '.cur',
    '.ani',
    '.pdf',
    '.bmp',
  ],
}

function getVariableName(p: NodePath<types.ImportDeclaration>) {
  if (p.node.specifiers?.[0] && p.node.specifiers[0].local) {
    return p.node.specifiers[0].local.name
  }
  return null
}

export default function ({ types: t }: { types: typeof types }): PluginObj {
  const manifestPath = join(getPaths().web.dist, 'build-manifest.json')
  const webpackManifest = require(manifestPath)

  return {
    name: 'babel-plugin-redwood-prerender-media-imports',
    visitor: {
      ImportDeclaration(p, state) {
        const importPath = p.node.source.value
        const ext = extname(importPath)
        const options = {
          ...defaultOptions,
          ...state.opts,
        }

        if (ext && options.extensions.includes(ext)) {
          const importConstName = getVariableName(p)
          const webpackManifestKey = `static/media/${basename(
            p.node.source.value
          )}`

          const copiedAssetPath = webpackManifest[webpackManifestKey]

          // If webpack has copied it over, use the path from the asset manifest
          // Otherwise convert it to a base64 encoded data uri
          const assetSrc =
            copiedAssetPath ??
            convertToDataUrl(
              join(state.file.opts.sourceRoot || './', importPath)
            )

          if (importConstName) {
            p.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importConstName),
                  t.stringLiteral(assetSrc)
                ),
              ])
            )
          }
        }
      },
    },
  }
}
