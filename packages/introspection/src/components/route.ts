import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import type { JSXElement, JSXAttribute } from '@babel/types'
import { isJSXIdentifier, isJSXAttribute, isJSXElement } from '@babel/types'

import { getASTFromFile, getJSXElementAttributes } from '../lib/ast'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'
import type { RedwoodRouter } from './router'

export class RedwoodRoute extends RedwoodIntrospectionComponent {
  readonly type = 'route'

  readonly path: string | undefined
  readonly pageIdentifier: string | undefined
  readonly prerender: boolean
  readonly isNotFound: boolean
  readonly hasParameters: boolean

  readonly isPrivate: boolean

  private constructor(
    filepath: string,
    routeJSXElementNodePath: NodePath<JSXElement>
  ) {
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
    this.hasParameters = this.path?.includes('{') || false // TODO: Should use a proper route parameter check here

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
  }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = []

    // Ensure the notfound route is valid
    if (this.isNotFound) {
      if (this.isPrivate) {
        errors.push({
          component: {
            type: this.type,
            filepath: this.filepath,
            name: this.name,
          },
          message: 'The notfound route cannot be private',
        })
      }
      if (this.path !== undefined) {
        errors.push({
          component: {
            type: this.type,
            filepath: this.filepath,
            name: this.name,
          },
          message: 'The notfound route cannot have a path property',
        })
      }
    }

    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    // No warnings for routes
    return []
  }

  static parseRoutes(router: RedwoodRouter) {
    const routes: RedwoodRoute[] = []

    const ast = getASTFromFile(router.filepath)

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
      throw new Error(`No <Router> found in ${router.filepath}`)
    }

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

    routeJSXElements.forEach((routeJSXElement) => {
      routes.push(new RedwoodRoute(router.filepath, routeJSXElement))
    })

    return routes
  }
}
