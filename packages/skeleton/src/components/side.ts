import fs from 'fs'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodErrorCode } from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export type RedwoodSideType = 'web' | 'api'

export class RedwoodSide extends RedwoodSkeleton {
  readonly type: RedwoodSideType

  constructor(filepath: string) {
    super(filepath)

    // TODO: Decide how best to determine sides from the project
    this.type = this.name === 'web' ? 'web' : 'api'

    if (!fs.existsSync(this.filepath)) {
      this.errors.push({
        code: RedwoodErrorCode.SIDE_NOT_FOUND,
        message: `Side ${this.name} does not exist`,
      })
    }
  }
}

export function extractSide(filepath: string) {
  return new RedwoodSide(filepath)
}

export function extractSides(project?: RedwoodProject) {
  const sides: RedwoodSide[] = []

  const basePath = project ? getPaths(project.filepath).base : getPaths().base

  // TODO: Decide how to automatically find all sides, this assumes the sides exist (which they really should)
  sides.push(new RedwoodSide(getPaths(basePath).web.base))
  sides.push(new RedwoodSide(getPaths(basePath).api.base))

  return sides
}
