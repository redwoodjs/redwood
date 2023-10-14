import path from 'node:path'

import type { ExportNamedDeclaration } from '@babel/types'
import {
  isArrowFunctionExpression,
  isFunctionExpression,
  isIdentifier,
  isObjectPattern,
  isObjectProperty,
  isVariableDeclaration,
  isVariableDeclarator,
} from '@babel/types'

import type {
  RedwoodIntrospectionError,
  RedwoodIntrospectionWarning,
} from '../introspection'
import { RedwoodIntrospectionComponent } from '../introspection'

export class RedwoodServiceFunction extends RedwoodIntrospectionComponent {
  readonly type = 'service-function'

  private readonly constructorErrors: RedwoodIntrospectionError[] = []

  readonly serviceName: string
  readonly parameters: string[] = []

  private constructor(
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
      this.constructorErrors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'Unable to extract the name of the service function',
      })
      this.constructorErrors.push({
        component: {
          type: this.type,
          filepath: this.filepath,
          name: this.name,
        },
        message: 'Unable to extract the parameters of the service function',
      })
      return
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
  }

  // executeAdditionalChecks() {
  // const associatedSDLOperation = this.getAssociatedSDLOperation()
  // if (associatedSDLOperation) {
  //   let parametersMatch =
  //     associatedSDLOperation.parameters.length === this.parameters.length
  //   for (let i = 0; i < this.parameters.length; i++) {
  //     parametersMatch &&=
  //       this.parameters[i] === associatedSDLOperation.parameters[i]
  //   }
  //   if (!parametersMatch) {
  //     this.errors.push({
  //       code: RedwoodErrorCode.SERVICE_FUNCTION_PARAMETERS_DO_NOT_MATCH_SDL_OPERATION,
  //       message: `The parameters of the "${this.name}" function do not match those of the correspondind SDL operation "${associatedSDLOperation.name}"`,
  //     })
  //   }
  // }
  // }

  getErrors(): RedwoodIntrospectionError[] {
    const errors: RedwoodIntrospectionError[] = [...this.constructorErrors]
    return errors
  }

  getWarnings(): RedwoodIntrospectionWarning[] {
    // No warnings for services
    return []
  }

  static parseServiceFunction(
    filepath: string,
    exportNamedDeclaration: ExportNamedDeclaration
  ) {
    return new RedwoodServiceFunction(filepath, exportNamedDeclaration)
  }

  // getAssociatedSDLOperation() {
  //   const sdl = RedwoodProject.getProject({ pathWithinProject: this.filepath })
  //     .getSDLs()
  //     .find((sdl) => {
  //       return sdl.name === this.serviceName
  //     })
  //   if (sdl) {
  //     const query = sdl.queries?.find((query) => {
  //       return query.name === this.name
  //     })
  //     const mutation = sdl.mutations?.find((mutation) => {
  //       return mutation.name === this.name
  //     })
  //     return query || mutation
  //   }
  //   return undefined
  // }
}
