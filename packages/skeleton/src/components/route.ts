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

  // TODO: Consider a "readonly parameters: something[]" maybe? I guess redwood/router should really be responsible for transforming path into a parameters[]

  constructor(
    filepath: string,
    options: {
      path?: string
      name?: string
      pageName?: string
      prerender?: boolean
      isNotFound?: boolean
      hasParameters?: boolean
    }
  ) {
    super(filepath, options.name)
    this.path = options.path
    this.pageName = options.pageName
    this.prerender = options.prerender ?? false
    this.isNotFound = options.isNotFound ?? false
    this.hasParameters = options.hasParameters ?? false
  }

  getPage(): RedwoodPage {
    throw new Error(`Method not implemented. PageName: ${this.pageName}`)
  }

  // Diagnostics

  getStatistics(): string {
    throw new Error('Method not implemented.')
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
  // TODO: Detect multiple <Router> and error about it?
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

  // Parse the children of <Router>

  const routeJSXElements: JSXElement[] = []
  traverse(
    routerJSXElementNodePath.node,
    {
      JSXElement: (path) => {
        if (
          isJSXIdentifier(path.node.openingElement.name) &&
          path.node.openingElement.name.name === 'Route'
        ) {
          routeJSXElements.push(path.node)
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
    let name, path, pageName
    const warnings: string[] = []
    const errors: string[] = []

    // TODO: Fix this overly repetitive code...

    // name property
    const nameAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        return isJSXAttribute(node) && node.name.name === 'name'
      }
    ) as JSXAttribute | undefined
    if (nameAttribute) {
      // TODO: Must it be a string value?
      if (nameAttribute != null && isStringLiteral(nameAttribute.value)) {
        name = nameAttribute.value.value
      } else {
        errors.push('The name property must have a string value')
      }
    }

    // path property
    const pathAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        return isJSXAttribute(node) && node.name.name === 'path'
      }
    ) as JSXAttribute | undefined
    if (pathAttribute) {
      // TODO: Must it be a string value?
      if (pathAttribute != null && isStringLiteral(pathAttribute.value)) {
        path = pathAttribute.value.value
      } else {
        errors.push('The path property must have a string value')
      }
    }

    // page property
    const pageAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        return isJSXAttribute(node) && node.name.name === 'page'
      }
    ) as JSXAttribute | undefined
    if (pageAttribute) {
      // TODO: What other ways can a Page be pased into the route?
      if (
        pageAttribute != null &&
        isJSXExpressionContainer(pageAttribute.value) &&
        isIdentifier(pageAttribute.value.expression)
      ) {
        pageName = pageAttribute.value.expression.name
      } else {
        errors.push('The page property could not be processed')
      }
    }

    // prerender property
    const prerenderAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        return isJSXAttribute(node) && node.name.name === 'prerender'
      }
    ) as JSXAttribute | undefined
    const prerender = prerenderAttribute !== undefined

    // notfound property
    const notfoundAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        return isJSXAttribute(node) && node.name.name === 'notfound'
      }
    ) as JSXAttribute | undefined
    const isNotFound = notfoundAttribute !== undefined

    const route = new RedwoodRoute(router.filepath, {
      name,
      path,
      pageName,
      prerender,
      isNotFound,
      hasParameters: path?.match(/(.*\{.+\}.*)+/) != null, // TODO: Improve this determination
    })
    route.warnings = warnings
    route.errors = errors
    routes.push(route)
  })

  // Check to make sure that the router is exported

  return routes
}
