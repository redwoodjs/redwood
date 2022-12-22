import path from 'path'

import {
  ExportNamedDeclaration,
  isArrowFunctionExpression,
  isFunctionExpression,
  isIdentifier,
  isObjectPattern,
  isObjectProperty,
  isVariableDeclaration,
  isVariableDeclarator,
} from '@babel/types'

import { RedwoodError, RedwoodErrorCode, RedwoodWarning } from '../diagnostic'
import { RedwoodProject } from '../project'
import type { RedwoodSDLMutation } from '../sdl/mutations'
import type { RedwoodSDLQuery } from '../sdl/query'
import { RedwoodSkeleton } from '../skeleton'

export class RedwoodServiceFunction extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  readonly serviceName: string
  readonly parameters: string[] = []

  constructor(
    filepath: string,
    exportNamedDeclaration: ExportNamedDeclaration
  ) {
    // Extract the function name
    let name: string | undefined = undefined
    if (
      isVariableDeclaration(exportNamedDeclaration.declaration) &&
      exportNamedDeclaration.declaration.declarations[0] != null &&
      isVariableDeclarator(
        exportNamedDeclaration.declaration.declarations[0]
      ) &&
      isIdentifier(exportNamedDeclaration.declaration.declarations[0].id)
    ) {
      name = exportNamedDeclaration.declaration.declarations[0].id.name
    }

    super(filepath, name)
    this.serviceName = path.parse(this.filepath).name

    if (name === undefined) {
      this.errors.push({
        code: RedwoodErrorCode.GENERIC_PARSER_ERROR_JSTS,
        message: 'Could not determine the name of a named export',
      })
    }

    // Extract the function parameters
    if (
      isVariableDeclaration(exportNamedDeclaration.declaration) &&
      exportNamedDeclaration.declaration.declarations[0] != null &&
      isVariableDeclarator(
        exportNamedDeclaration.declaration.declarations[0]
      ) &&
      (isArrowFunctionExpression(
        exportNamedDeclaration.declaration.declarations[0].init
      ) ||
        isFunctionExpression(
          exportNamedDeclaration.declaration.declarations[0].init
        ))
    ) {
      const parameters =
        exportNamedDeclaration.declaration.declarations[0].init.params[0]
      if (isObjectPattern(parameters)) {
        parameters.properties.forEach((property) => {
          if (isObjectProperty(property) && isIdentifier(property.key)) {
            this.parameters.push(property.key.name)
          }
        })
      }
    }

    // Checks

    const associatedSDLOperation = this.getAssociatedSDLOperation()
    if (associatedSDLOperation) {
      let parametersMatch =
        associatedSDLOperation.parameters.length === this.parameters.length
      for (let i = 0; i < this.parameters.length; i++) {
        parametersMatch &&=
          this.parameters[i] === associatedSDLOperation.parameters[i]
      }
      if (!parametersMatch) {
        this.errors.push({
          code: RedwoodErrorCode.SERVICE_FUNCTION_PARAMETERS_DO_NOT_MATCH_SDL_OPERATION,
          message: `The parameters of the "${this.name}" function do not match those of the correspondind SDL operation "${associatedSDLOperation.name}"`,
        })
      }
    }
  }

  getAssociatedSDLOperation():
    | undefined
    | RedwoodSDLQuery
    | RedwoodSDLMutation {
    const sdl = RedwoodProject.getProject({ pathWithinProject: this.filepath })
      .getSDLs()
      .find((sdl) => {
        return sdl.name === this.serviceName
      })
    if (sdl) {
      const query = sdl.queries?.find((query) => {
        return query.name === this.name
      })
      const mutation = sdl.mutations?.find((mutation) => {
        return mutation.name === this.name
      })
      return query || mutation
    }
    return undefined
  }
}
