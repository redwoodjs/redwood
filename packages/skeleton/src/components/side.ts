import fs from 'fs'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodError, RedwoodErrorCode, RedwoodWarning } from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export enum RedwoodSideType {
  WEB = 'web',
  API = 'api',
}

export class RedwoodSide extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  readonly type: RedwoodSideType

  constructor(filepath: string) {
    super(filepath)

    // TODO: Decide how best to determine sides from the folder
    this.type = this.name === 'web' ? RedwoodSideType.WEB : RedwoodSideType.API

    if (!fs.existsSync(this.filepath)) {
      this.errors.push({
        code: RedwoodErrorCode.SIDE_NOT_FOUND,
        message: `Side ${this.name} does not exist`,
      })
    }
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

  // TODO: Decide how to automatically find all sides, this assumes the sides exist (which they really should)
  sides.push(new RedwoodSide(getPaths(basePath).web.base))
  sides.push(new RedwoodSide(getPaths(basePath).api.base))

  return sides
}
