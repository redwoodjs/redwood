// import url from 'node:url'
import path from 'path'

import generate from '@babel/generator'
import { parse as babelParse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { Plugin } from 'vite'
import { normalizePath } from 'vite'

import { getPaths, importStatementPath } from '@redwoodjs/project-config'
import { getProject } from '@redwoodjs/structure/dist/index'
const getPathRelativeToSrc = (maybeAbsolutePath: string) => {
  // If the path is already relative
  if (!path.isAbsolute(maybeAbsolutePath)) {
    return maybeAbsolutePath
  }

  return `./${path.relative(getPaths().web.src, maybeAbsolutePath)}`
}

export function rscRoutesAutoLoader(): Plugin {
  // Vite IDs are always normalized and so we avoid windows path issues
  // by normalizing the path here.
  const routesFileId = normalizePath(getPaths().web.routes)

  // Get the current pages in the project from routes
  const rwProject = getProject(getPaths().base)
  const routes = rwProject.getRouter().routes

  // Create a map of pages to routes.
  // Note that a page can have multiple routes.
  const routePages: {
    [key: string]: { routes: { name: string; path: string }[] }
  } = routes.reduce(
    (
      map: { [key: string]: { routes: { name: string; path: string }[] } },
      route,
    ) => {
      const { name, path, page } = route
      if (page && name && path) {
        const key = page?.const_
        if (key && !map[key]) {
          map[key] = { routes: [] }
        }

        map[key].routes.push({ name, path })
      }
      return map
    },
    {},
  )

  return {
    name: 'rsc-routes-auto-loader-dev',
    transform: async function (code, id, options) {
      // We only care about the routes file
      if (id !== routesFileId) {
        return null
      }

      // If we have no routes with pages then we have no reason to do anything here
      if (Object.entries(routePages).length === 0) {
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

      console.error('loadFunctionName', loadFunctionName)
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
      const nonImportedPages = Object.keys(routePages).filter(
        (rp) => !importedNames.has(rp),
      )

      // Insert the page loading into the code
      // and pass the rscId and the routes to the load function
      Object.entries(routePages).forEach((i) => {
        const key = i[0]
        const routes = i[1].routes
        if (nonImportedPages.includes(key)) {
          // when SSR and renderFromDist no need to pass routes
          if (loadFunctionName === 'renderFromDist') {
            ast.program.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(key),
                  t.callExpression(t.identifier(loadFunctionName), [
                    t.stringLiteral(key),
                  ]),
                ),
              ]),
            )
          }
          // pass the rscId and routes to renderFromRscServer
          // since routes are needed to enforce auth and permissions on the client side
          if (loadFunctionName === 'renderFromRscServer') {
            const routesArrayElements = routes.map((route) =>
              t.objectExpression([
                t.objectProperty(
                  t.identifier('name'),
                  t.stringLiteral(route.name),
                ),
                t.objectProperty(
                  t.identifier('path'),
                  t.stringLiteral(route.path),
                ),
              ]),
            )
            ast.program.body.unshift(
              t.variableDeclaration('const', [
                t.variableDeclarator(
                  t.identifier(key),
                  t.callExpression(t.identifier(loadFunctionName), [
                    t.stringLiteral(key),
                    t.objectExpression([
                      t.objectProperty(
                        t.identifier('routes'),
                        t.arrayExpression(routesArrayElements),
                      ),
                    ]),
                  ]),
                ),
              ]),
            )
          }
        }
      })

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

      const output = generate(ast).code
      console.debug('output', output)
      // throw new Error('test')
      return output
    },
  }
}
