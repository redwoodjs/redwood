import { extname, basename, join } from 'path'

import type { PluginObj, types, NodePath } from '@babel/core'

import { getPaths } from '@redwoodjs/internal'

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

// Blank single pixel for url-loaded images
const BLANK_IMG_DATA_SRC =
  'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

export default function ({ types: t }: { types: typeof types }): PluginObj {
  const manifestPath = join(getPaths().web.dist, 'manifest.json')
  const webpackManifest = require(manifestPath)

  return {
    name: 'babel-plugin-redwood-prerender-media-imports',
    visitor: {
      ImportDeclaration(p, state) {
        const ext = extname(p.node.source.value)
        const options = {
          ...defaultOptions,
          ...state.opts,
        }

        if (ext && options.extensions.includes(ext)) {
          const importConstName = getVariableName(p)
          const webpackManifestKey = `static/media/${basename(
            p.node.source.value
          )}`

          const processedFilePath = webpackManifest[webpackManifestKey]

          if (importConstName) {
            p.replaceWith(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importConstName),
                  t.stringLiteral(processedFilePath || BLANK_IMG_DATA_SRC)
                ),
              ])
            )
          }
        }
      },
    },
  }
}
