import fs from 'fs'
import path from 'path'

import { parse as parseTOML } from '@iarna/toml'

import { getPaths } from '@redwoodjs/internal/dist/paths'

import { RedwoodErrorCode } from './diagnostic'
import type { RedwoodProject } from './project'
import { RedwoodSkeleton } from './skeleton'

export class RedwoodTOML extends RedwoodSkeleton {
  readonly contents: any

  constructor(filepath: string) {
    super(filepath)

    try {
      this.contents = parseTOML(
        fs.readFileSync(filepath, { encoding: 'utf-8', flag: 'r' })
      )
    } catch (_) {
      this.errors.push({
        code: RedwoodErrorCode.TOML_PARSE_ERROR,
        message: 'Could not parse the file, invalid syntax?',
      })
    }
  }
}

export function extractTOML(filepath: string) {
  return new RedwoodTOML(filepath)
}

export function extractTOMLs(project?: RedwoodProject) {
  const tomls: RedwoodTOML[] = []

  const toml = path.join(
    project ? getPaths(project.filepath).base : getPaths().base,
    'redwood.toml'
  )

  if (!fs.existsSync(toml)) {
    return tomls
  }

  return [extractTOML(toml)]
}
