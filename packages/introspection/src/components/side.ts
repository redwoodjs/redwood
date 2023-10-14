import fs from 'node:fs'

import { getBaseDir, getConfigPath, getPaths } from '@redwoodjs/project-config'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from './introspection'
import { RedwoodIntrospectionComponent } from './introspection'

export type RedwoodSideType = 'web' | 'api' | 'unknown'

export class RedwoodSide extends RedwoodIntrospectionComponent {
  readonly type = 'side'

  readonly sideType: RedwoodSideType

  private constructor(filepath: string) {
    super(filepath)

    switch (this.name) {
      case 'web':
        this.sideType = 'web'
        break
      case 'api':
        this.sideType = 'api'
        break
      default:
        this.sideType = 'unknown'
        break
    }
  }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = []

    // Check if the side is supported - currently only 'web' and 'api' are supported
    if (this.sideType === 'unknown') {
      errors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: `Side from '${this.name}' is not supported`,
      })
    }

    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    // No warnings for sides
    return []
  }

  static parseSide(filepath: string) {
    return new RedwoodSide(filepath)
  }

  static parseSides(directory: string = getPaths().base) {
    const sides: RedwoodSide[] = []

    // In the future we should update this to handle whatever dynamic/multiple side support we have
    const paths = getPaths(getBaseDir(getConfigPath(directory)))
    if (fs.existsSync(paths.web.base)) {
      sides.push(new RedwoodSide(paths.web.base))
    }
    if (fs.existsSync(paths.api.base)) {
      sides.push(new RedwoodSide(paths.api.base))
    }

    return sides
  }
}
