import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodSkeleton } from './base'
import type { RedwoodProject } from './project'

export enum RedwoodSideType {
  WEB = 'web',
  API = 'api',
}

export class RedwoodSide extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly type: RedwoodSideType

  constructor(filepath: string) {
    super(filepath)

    // TODO: Decide how best to determine sides from the folder
    this.type = this.name === 'web' ? RedwoodSideType.WEB : RedwoodSideType.API
  }

  // Diagnostics

  getStatistics(): string {
    throw new Error('Method not implemented.')
  }
}

export function extractSide(filepath: string): RedwoodSide {
  return new RedwoodSide(filepath)
}

export function extractSides(
  project: RedwoodProject | undefined = undefined
): RedwoodSide[] {
  const sides: RedwoodSide[] = []

  const basePath = project ? getPaths(project.filepath).base : getPaths().base

  // TODO: Decide how to automatically find all sides, this assumes the sides exist - BAD!
  sides.push(new RedwoodSide(getPaths(basePath).web.base))
  sides.push(new RedwoodSide(getPaths(basePath).api.base))

  return sides
}
