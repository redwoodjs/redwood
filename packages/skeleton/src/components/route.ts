import fs from 'fs'

import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import {
  isJSXIdentifier,
  isJSXAttribute,
  isJSXElement,
  JSXElement,
  JSXAttribute,
} from '@babel/types'

import { getASTFromCode, getJSXElementAttributes } from '../lib/ast'

import { RedwoodSkeleton } from './base'
import type { RedwoodPage } from './page'
import { RedwoodProject } from './project'
import type { RedwoodRouter } from './router'
import { RedwoodSideType } from './side'

export class RedwoodRoute extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly path: string | undefined
  readonly pageIdentifier: string | undefined
  readonly prerender: boolean
  readonly isNotFound: boolean
  readonly hasParameters: boolean

  readonly isPrivate: boolean

  constructor(filepath: string, routeJSXElementNodePath: NodePath<JSXElement>) {
    const routeAttributes = getJSXElementAttributes(
      routeJSXElementNodePath.node
    )

    super(
      filepath,
      routeAttributes.has('notfound') ? 'notfound' : routeAttributes.get('name') // name
    )

    this.path = routeAttributes.get('path')
    this.pageIdentifier = routeAttributes.get('page')
    this.isNotFound = routeAttributes.has('notfound')
    this.prerender = routeAttributes.has('prerender')
    this.hasParameters = this.path?.match(/(.*\{.+\}.*)+/) != null // TODO: Should use a proper route parameter check here

    // TODO: Extract layouts from wrapping elements
    let parent = routeJSXElementNodePath.parentPath
    while (parent.parentPath != null) {
      if (
        isJSXElement(parent.node) &&
        isJSXIdentifier(parent.node.openingElement.name)
      ) {
        const wrapperElementName = parent.node.openingElement.name.name
        if (wrapperElementName === 'Set') {
          const privateProperty = parent.node.openingElement.attributes.find(
            (attribute): attribute is JSXAttribute => {
              return (
                isJSXAttribute(attribute) && attribute.name.name === 'private'
              )
            }
          )
          this.isPrivate ||= privateProperty !== undefined
        } else if (wrapperElementName === 'Private') {
          this.isPrivate = true
        } else if (wrapperElementName === 'Router') {
          break // We're at the top level of the <Router>
        }
      }
      parent = parent.parentPath
    }

    // Assume public if not found to be within a <Private> or <Set private>
    this.isPrivate ||= false

    // Checks

    if (this.isNotFound) {
      if (this.isPrivate) {
        this.errors.push('The notfound page cannot be private')
      }
      if (this.path !== undefined) {
        this.errors.push('The notfound page cannot have a path property')
      }
    }
    // TODO: (Check) Routes should contain a name if they aren't the notfound page?
  }

  getPage(): RedwoodPage | undefined {
    return RedwoodProject.getProject({
      pathWithinProject: this.filepath,
    })
      .getPages(true)
      .find((page) => {
        return page.name === this.pageIdentifier
      })
  }
}

export function extractRoutes(router: RedwoodRouter): RedwoodRoute[] {
  let routes: RedwoodRoute[] = []
  switch (router.getSide().type) {
    case RedwoodSideType.WEB:
      routes = extractFromWebRouter(router)
      break
    default:
      // TODO: Handle this error
      break
  }
  return routes
}

function extractFromWebRouter(router: RedwoodRouter): RedwoodRoute[] {
  const routes: RedwoodRoute[] = []

  const code = fs.readFileSync(router.filepath, { encoding: 'utf8', flag: 'r' })
  const ast = getASTFromCode(code)

  // Find the <Router>
  let routerJSXElementNodePath: NodePath<JSXElement> | undefined
  traverse(ast, {
    JSXElement: (path) => {
      if (
        isJSXIdentifier(path.node.openingElement.name) &&
        path.node.openingElement.name.name === 'Router'
      ) {
        routerJSXElementNodePath = path
      }
    },
  })
  if (routerJSXElementNodePath === undefined) {
    router.errors.push('Could not find the Router JSX element')
    return []
  }
  // TODO: (check) Detect multiple <Router> and error about it?

  // Parse the children of <Router>
  const routeJSXElements: NodePath<JSXElement>[] = []
  traverse(
    routerJSXElementNodePath.node,
    {
      JSXElement: (path) => {
        if (
          isJSXIdentifier(path.node.openingElement.name) &&
          path.node.openingElement.name.name === 'Route'
        ) {
          routeJSXElements.push(path)
        }
      },
    },
    routerJSXElementNodePath.scope
  )
  if (routeJSXElements.length === 0) {
    router.warnings.push('No routes were found')
    return []
  }

  routeJSXElements.forEach((routeJSXElement) => {
    routes.push(new RedwoodRoute(router.filepath, routeJSXElement))
  })

  // TODO: (Check) Make sure that the router is actually exported

  return routes
}
