import fs from 'fs'

import type { NodePath } from '@babel/core'
import traverse from '@babel/traverse'
import type { JSXElement, JSXAttribute } from '@babel/types'
import {
  isJSXIdentifier,
  isJSXAttribute,
  isStringLiteral,
  isJSXExpressionContainer,
  isIdentifier,
  isJSXElement,
} from '@babel/types'

import { getASTFromCode } from '../lib/ast'

import { RedwoodSkeleton } from './base'
import { RedwoodPage } from './page'
import type { RedwoodRouter } from './router'
import { RedwoodSideType } from './side'

export class RedwoodRoute extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly path: string | undefined
  private readonly pageName: string | undefined
  readonly prerender: boolean
  readonly isNotFound: boolean
  readonly hasParameters: boolean

  readonly isPrivate: boolean

  // TODO: Fix this overly repetitive code...
  constructor(filepath: string, routeJSXElementNodePath: NodePath<JSXElement>) {
    // name property, must be pre-super because we want to pass name to the superclass
    let name
    const nameErrors: string[] = []
    const nameAttribute =
      routeJSXElementNodePath.node.openingElement.attributes.find(
        (node): node is JSXAttribute => {
          return isJSXAttribute(node) && node.name.name === 'name'
        }
      )
    if (nameAttribute) {
      // TODO: Must it be a string value?
      if (nameAttribute != null && isStringLiteral(nameAttribute.value)) {
        name = nameAttribute.value.value
      } else {
        nameErrors.push('The name property must have a string value')
      }
    }

    // notfound property, must be pre-super because we want to set the name to notfound
    const notfoundAttribute =
      routeJSXElementNodePath.node.openingElement.attributes.find(
        (node): node is JSXAttribute => {
          return isJSXAttribute(node) && node.name.name === 'notfound'
        }
      )
    if (notfoundAttribute !== undefined) {
      name = 'notfound'
    }

    super(filepath, name)
    this.errors.push(...nameErrors)

    // path property
    const pathAttribute =
      routeJSXElementNodePath.node.openingElement.attributes.find(
        (node): node is JSXAttribute => {
          return isJSXAttribute(node) && node.name.name === 'path'
        }
      )
    if (pathAttribute) {
      // TODO: Must it be a string value?
      if (pathAttribute != null && isStringLiteral(pathAttribute.value)) {
        this.path = pathAttribute.value.value
      } else {
        this.errors.push('The path property must have a string value')
      }
    }

    // page property
    const pageAttribute =
      routeJSXElementNodePath.node.openingElement.attributes.find(
        (node): node is JSXAttribute => {
          return isJSXAttribute(node) && node.name.name === 'page'
        }
      )
    if (pageAttribute) {
      // TODO: What other ways can a Page be passed into the route?
      if (
        pageAttribute != null &&
        isJSXExpressionContainer(pageAttribute.value) &&
        isIdentifier(pageAttribute.value.expression)
      ) {
        this.pageName = pageAttribute.value.expression.name
      } else {
        this.errors.push('The page property could not be processed')
      }
    }

    // notfound property
    this.isNotFound = notfoundAttribute !== undefined

    // prerender property
    const prerenderAttribute =
      routeJSXElementNodePath.node.openingElement.attributes.find(
        (node): node is JSXAttribute => {
          return isJSXAttribute(node) && node.name.name === 'prerender'
        }
      )
    this.prerender = prerenderAttribute !== undefined

    // TODO: Improve this detection
    this.hasParameters = this.path?.match(/(.*\{.+\}.*)+/) != null

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
  }

  getPage(): RedwoodPage {
    throw new Error(`Method not implemented. PageName: ${this.pageName}`)
  }

  getInformation(): string {
    return '' // TODO: Implement
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
  // TODO: Detect multiple <Router> and error about it?

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

  // TODO: Check to make sure that the router is actually exported

  return routes
}
