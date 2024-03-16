import type { PluginObj, types } from '@babel/core'

import {
  ensurePosixPath,
  importStatementPath,
  processPagesDir,
} from '@redwoodjs/project-config'

import {
  getPathRelativeToSrc,
  withRelativeImports,
} from './babel-plugin-redwood-routes-auto-loader'

export function RedwoodRoutesAutoLoaderRscClientPlugin({
  types: t,
}: {
  types: typeof types
}): PluginObj {
  // @NOTE: This var gets mutated inside the visitors
  let pages = processPagesDir().map(withRelativeImports)

  // Currently processPagesDir() can return duplicate entries when there are multiple files
  // ending in Page in the individual page directories. This will cause an error upstream.
  // Here we check for duplicates and throw a more helpful error message.
  const duplicatePageImportNames = new Set<string>()
  const sortedPageImportNames = pages.map((page) => page.importName).sort()
  for (let i = 0; i < sortedPageImportNames.length - 1; i++) {
    if (sortedPageImportNames[i + 1] === sortedPageImportNames[i]) {
      duplicatePageImportNames.add(sortedPageImportNames[i])
    }
  }

  if (duplicatePageImportNames.size > 0) {
    throw new Error(
      `Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in the follow page directories: ${Array.from(
        duplicatePageImportNames,
      )
        .map((name) => `'${name}'`)
        .join(', ')}`,
    )
  }

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
          importStatementPath(p.node.source?.value),
        )

        const defaultSpecifier = p.node.specifiers.filter((specifiers) =>
          t.isImportDefaultSpecifier(specifiers),
        )[0]

        if (userImportRelativePath && defaultSpecifier) {
          // Remove the page from pages list, if it is already explicitly imported, so that we don't add loaders for these pages.
          // We use the path & defaultSpecifier because the const name could be anything
          pages = pages.filter(
            (page) =>
              !(
                page.relativeImport === ensurePosixPath(userImportRelativePath)
              ),
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

          // For RSC Client builds add
          // import { renderFromRscServer } from '@redwoodjs/vite/client'
          // This will perform a fetch request to the remote RSC server
          nodes.unshift(
            t.importDeclaration(
              [
                t.importSpecifier(
                  t.identifier('renderFromRscServer'),
                  t.identifier('renderFromRscServer'),
                ),
              ],
              t.stringLiteral('@redwoodjs/vite/client'),
            ),
          )

          // Prepend all imports to the top of the file
          for (const { importName } of pages) {
            // RSC client wants this format
            // const AboutPage = renderFromRscServer('AboutPage')
            nodes.push(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(importName),
                  t.callExpression(t.identifier('renderFromRscServer'), [
                    t.stringLiteral(importName),
                  ]),
                ),
              ]),
            )
          }

          // Insert at the top of the file
          p.node.body.unshift(...nodes)
        },
      },
    },
  }
}
