import fs from 'fs'

import { ExportDefaultDeclaration, Node } from '@babel/types'

import { getASTFromCode } from '../lib/ast'

import { RedwoodSkeleton } from './base'
import type { RedwoodRouter } from './router'
import { RedwoodSideType } from './side'

export class RedwoodRoute extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  constructor(filepath: string) {
    super(filepath)
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
      routes = extractWebRouterRoutes(router)
      break
    default:
      // TODO: Handle this error
      break
  }
  return routes
}

function extractWebRouterRoutes(router: RedwoodRouter): RedwoodRoute[] {
  const routes: RedwoodRoute[] = []

  const code = fs.readFileSync(router.filepath, { encoding: 'utf8', flag: 'r' })
  const ast = getASTFromCode(code)

  // get the default export - hmm tricky since it could be an identifier (as it should be) or maybe it'll be the arrow function directly

  const defaultExport = ast.program.body.find((node: Node) => {
    return node.type === 'ExportDefaultDeclaration'
  }) as ExportDefaultDeclaration | undefined
  if (defaultExport === undefined) {
    router.errors.push('Could not find the default export')
    return []
  }

  console.log(defaultExport)

  return routes
}
