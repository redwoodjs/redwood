import path from 'path'

import { FieldDefinitionNode } from 'graphql'

import { parseGraphQL } from '../../lib/gql'
import { RedwoodError, RedwoodErrorCode, RedwoodWarning } from '../diagnostic'
import { RedwoodProject } from '../project'
import { RedwoodSkeleton } from '../skeleton'

import { RedwoodSDL } from './sdl'

export class RedwoodSDLMutation extends RedwoodSkeleton {
  warnings: RedwoodWarning[] = []
  errors: RedwoodError[] = []

  readonly SDLName: string
  readonly parameters: string[] = []
  readonly directiveNames: string[] = []

  constructor(filepath: string, field: FieldDefinitionNode) {
    super(filepath, field.name.value)

    this.SDLName = path.parse(this.filepath).name
    this.SDLName = this.SDLName.substring(0, this.SDLName.length - 4)

    field.directives?.forEach((directive) => {
      this.directiveNames.push(directive.name.value)
    })

    const parameterNames = field.arguments?.map((arg) => {
      return arg.name.value
    })
    if (parameterNames !== undefined) {
      this.parameters.push(...parameterNames)
    }
  }

  executeAdditionalChecks(): void {
    const knownDirectives = RedwoodProject.getProject({
      pathWithinProject: this.filepath,
    }).getDirectives()

    this.directiveNames.forEach((directiveName) => {
      const directiveExists = knownDirectives.some((knownDirective) => {
        return knownDirective.name === directiveName
      })
      if (!directiveExists) {
        this.errors.push({
          code: RedwoodErrorCode.SDL_DIRECTIVE_NOT_FOUND,
          message: `Directive "${directiveName}" is not known`,
        })
      }
    })

    const correspondingService = RedwoodProject.getProject({
      pathWithinProject: this.filepath,
    })
      .getServices()
      .find((service) => {
        return service.name === this.SDLName
      })
    if (correspondingService) {
      const correspondingServiceFunction = correspondingService.functions.find(
        (func) => {
          return func.name === this.name
        }
      )
      if (!correspondingServiceFunction) {
        this.errors.push({
          code: RedwoodErrorCode.SDL_NO_CORRESPONDING_SERVICE_FUNCTION,
          message: `There is no corresponding service function named "${this.name}"`,
        })
      }
    } else {
      this.errors.push({
        code: RedwoodErrorCode.SDL_NO_CORRESPONDING_SERVICE_FILE,
        message: `There is no corresponding service file named "${this.SDLName}"`,
      })
    }
  }
}

export function extractMutations(sdl: RedwoodSDL): RedwoodSDLMutation[] {
  const mutations: RedwoodSDLMutation[] = []

  if (sdl.gql === undefined) {
    return mutations
  }

  let gqlAST
  try {
    gqlAST = parseGraphQL(sdl.gql)
  } catch (_) {
    sdl.errors.push({
      code: RedwoodErrorCode.GENERIC_PARSER_ERROR_GQL,
      message: `Unabled to extract mutations because the gql is invalid`,
    })
    return mutations
  }

  gqlAST.definitions.forEach((definition) => {
    if (
      definition.kind === 'ObjectTypeDefinition' &&
      definition.name.value === 'Mutation'
    ) {
      definition.fields?.forEach((field) => {
        mutations.push(new RedwoodSDLMutation(sdl.filepath, field))
      })
    }
  })

  return mutations
}
