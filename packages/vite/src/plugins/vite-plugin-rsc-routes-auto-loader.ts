import url from 'node:url'
import path from 'path'

import generate from '@babel/generator'
import { parse as babelParse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { Plugin } from 'vite'
import { normalizePath } from 'vite'

import type { RWRouteManifestItem } from '@redwoodjs/internal'
// import {
//   //ensurePosixPath,
//   getPaths,
// } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'
// import { RWProject } from '@redwoodjs/structure/dist/model'
import type { RWPage } from '@redwoodjs/structure/dist/model/RWPage'
import type { RWRoute } from '@redwoodjs/structure/dist/model/RWRoute'
const getPathRelativeToSrc = (maybeAbsolutePath: string) => {
  // If the path is already relative
  if (!path.isAbsolute(maybeAbsolutePath)) {
    return maybeAbsolutePath
  }

  return `./${path.relative(getPaths().web.src, maybeAbsolutePath)}`
}

export const getRoutesList = async () => {
  const rwPaths = getPaths()

  if (process.env.NODE_ENV === 'development') {
    const { getProjectRoutes } = await import(
      '@redwoodjs/internal/dist/routes.js'
    )
    return getProjectRoutes()
  } else {
    const routeManifestUrl = url.pathToFileURL(rwPaths.web.routeManifest).href
    const routeManifest: Record<string, RWRouteManifestItem> = (
      await import(routeManifestUrl, { with: { type: 'json' } })
    ).default

    return Object.values(routeManifest)
  }
}

// const withRelativeImports = (page: PagesDependency) => {
//   return {
//     ...page,
//     relativeImport: ensurePosixPath(getPathRelativeToSrc(page.importPath)),
//   }
// }

export function rscRoutesAutoLoader(): Plugin {
  // Vite IDs are always normalized and so we avoid windows path issues
  // by normalizing the path here.
  const routesFileId = normalizePath(getPaths().web.routes)

  // Get the current pages
  // @NOTE: This var gets mutated inside the visitors
  // const pages = processPagesDir().map(withRelativeImports)

  const routes = await getRoutesList()
  const pages = routes.map((route: RWRoute) => route.page) as RWPage[]

  // Currently processPagesDir() can return duplicate entries when there are multiple files
  // ending in Page in the individual page directories. This will cause an error upstream.
  // Here we check for duplicates and throw a more helpful error message.
  const duplicatePageImportNames = new Set<string>()
  // importName
  const sortedPageImportNames = routes
    .map((route) => route.page_identifier_str || route.page?.basename || '')
    .sort()
  for (let i = 0; i < sortedPageImportNames.length - 1; i++) {
    if (sortedPageImportNames[i + 1] === sortedPageImportNames[i]) {
      duplicatePageImportNames.add(sortedPageImportNames[i])
    }
  }
  if (duplicatePageImportNames.size > 0) {
    const pageNames = Array.from(duplicatePageImportNames)
      .map((name) => `'${name}'`)
      .join(', ')

    throw new Error(
      "Unable to find only a single file ending in 'Page.{js,jsx,ts,tsx}' in " +
        `the following page directories: ${pageNames}`,
    )
  }

  return {
    name: 'rsc-routes-auto-loader-dev',
    transform: async function (code, id, options) {
      // We only care about the routes file
      if (id !== routesFileId) {
        return null
      }

      // If we have no pages then we have no reason to do anything here
      if (pages.length === 0) {
        return null
      }

      // We have to handle the loading of routes in two different ways depending on if
      // we are doing SSR or not. During SSR we want to load files directly whereas on
      // the client we have to fetch things over the network.
      const isSsr = options?.ssr ?? false

      const loadFunctionModule = isSsr
        ? '@redwoodjs/vite/clientSsr'
        : '@redwoodjs/vite/client'
      const loadFunctionName = isSsr ? 'renderFromDist' : 'renderFromRscServer'

      // Parse the code as AST
      const ext = path.extname(id)
      const plugins: any[] = []
      if (ext === '.jsx') {
        plugins.push('jsx')
      }
      const ast = babelParse(code, {
        sourceType: 'unambiguous',
        plugins,
      })

      // We have to filter out any pages which the user has already explicitly imported
      // in the routes file otherwise there would be conflicts.
      const importedNames = new Set<string>()
      traverse(ast, {
        ImportDeclaration(p) {
          const importPath = p.node.source.value
          if (importPath === null) {
            return
          }

          const userImportRelativePath = getPathRelativeToSrc(
            importStatementPath(p.node.source?.value),
          )

          const defaultSpecifier = p.node.specifiers.filter((specifiers) =>
            t.isImportDefaultSpecifier(specifiers),
          )[0]

          if (userImportRelativePath && defaultSpecifier) {
            importedNames.add(defaultSpecifier.local.name)
          }
        },
      })
      const nonImportedPages = pages.filter(
        (page) => !importedNames.has(page.importName),
      )

      // Insert the page loading into the code
      for (const page of nonImportedPages) {
        ast.program.body.unshift(
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(page.const),
              t.callExpression(t.identifier(loadFunctionName), [
                t.stringLiteral(page.const),
              ]),
            ),
          ]),
        )
      }

      // Insert an import for the load function we need
      ast.program.body.unshift(
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(loadFunctionName),
              t.identifier(loadFunctionName),
            ),
          ],
          t.stringLiteral(loadFunctionModule),
        ),
      )

      return generate(ast).code
    },
  }
}
