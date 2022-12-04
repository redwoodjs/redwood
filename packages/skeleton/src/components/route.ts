import fs from 'fs'

import type { NodePath } from '@babel/core'
import traverse from '@babel/traverse'
import type {
  JSXElement,
  JSXAttribute,
  StringLiteral,
  JSXExpressionContainer,
  Identifier,
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

  // TODO: readonly hasParameters: boolean
  // TODO: Consider a "readonly parameters: something[]" maybe? I guess redwood/router should really be responsible for transforming path into a parameters[]

  constructor(
    filepath: string,
    options: {
      path?: string
      name?: string
      pageName?: string
      prerender?: boolean
      isNotFound?: boolean
    }
  ) {
    super(filepath, options.name)
    this.path = options.path
    this.pageName = options.pageName
    this.prerender = options.prerender ?? false
    this.isNotFound = options.isNotFound ?? false
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
  let routerJSXElementNodePath: NodePath<JSXElement> | undefined
  traverse(ast, {
    JSXElement: (path) => {
      if (
        path.node.openingElement.name.type === 'JSXIdentifier' &&
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
          path.node.openingElement.name.type === 'JSXIdentifier' &&
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
        if (node.type === 'JSXSpreadAttribute') {
          throw new Error('JSXSpreadAttribute is not handled')
        }
        return node.name.name === 'name'
      }
    ) as JSXAttribute
    if (nameAttribute) {
      // TODO: Maybe there is a better way to assert like this?
      // TODO: Must it be a string value?
      if (
        nameAttribute.value == null ||
        nameAttribute.value.type !== 'StringLiteral'
      ) {
        errors.push('The name property must have a string value')
      } else {
        name = (nameAttribute.value as StringLiteral).value
      }
    }

    // path property
    const pathAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        if (node.type === 'JSXSpreadAttribute') {
          throw new Error('JSXSpreadAttribute is not handled')
        }
        return node.name.name === 'path'
      }
    ) as JSXAttribute
    if (pathAttribute) {
      // TODO: Maybe there is a better way to assert like this?
      // TODO: Must it be a string value?
      if (
        pathAttribute.value == null ||
        pathAttribute.value.type !== 'StringLiteral'
      ) {
        errors.push('The path property must have a string value')
      } else {
        path = (pathAttribute.value as StringLiteral).value
      }
    }

    // page property
    const pageAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        if (node.type === 'JSXSpreadAttribute') {
          throw new Error('JSXSpreadAttribute is not handled')
        }
        return node.name.name === 'page'
      }
    ) as JSXAttribute
    if (pageAttribute) {
      // TODO: Maybe there is a better way to assert like this?
      // TODO: Must it be a string value?
      if (
        pageAttribute.value == null ||
        pageAttribute.value.type !== 'JSXExpressionContainer' ||
        pageAttribute.value.expression.type !== 'Identifier'
      ) {
        errors.push('The page property could not be processed')
      } else {
        pageName = (
          (pageAttribute.value as JSXExpressionContainer)
            .expression as Identifier
        ).name
      }
    }

    // prerender property
    const prerenderAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        if (node.type === 'JSXSpreadAttribute') {
          throw new Error('JSXSpreadAttribute is not handled')
        }
        return node.name.name === 'prerender'
      }
    ) as JSXAttribute
    const prerender = prerenderAttribute !== undefined

    // notfound property
    const notfoundAttribute = routeJSXElement.openingElement.attributes.find(
      (node) => {
        if (node.type === 'JSXSpreadAttribute') {
          throw new Error('JSXSpreadAttribute is not handled')
        }
        return node.name.name === 'notfound'
      }
    ) as JSXAttribute
    const isNotFound = notfoundAttribute !== undefined

    const route = new RedwoodRoute(router.filepath, {
      name,
      path,
      pageName,
      prerender,
      isNotFound,
    })
    route.warnings = warnings
    route.errors = errors
    routes.push(route)
  })

  // Check to make sure that the router is exported

  return routes
}
