import path from 'path'

import { generateTypeDef } from './helpers'

export function generateCurrentUserTypes() {
  generateTypeDef(
    'currentUser.d.ts',
    path.join(__dirname, './templates/currentUser.d.ts.template')
  )
}

export function generateScenarioTypes() {
  generateTypeDef(
    'scenarios.d.ts',
    path.join(__dirname, './templates/scenarios.d.ts.template')
  )
}
