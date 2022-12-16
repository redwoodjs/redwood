import { FieldDefinitionNode } from 'graphql'

import { parseGraphQL } from '../../lib/gql'
import { RedwoodSkeleton } from '../skeleton'
import { RedwoodProject } from '../project'

import { RedwoodSDL } from './sdl'

export class RedwoodSDLMutation extends RedwoodSkeleton {
  warnings: string[] = []
  errors: string[] = []

  readonly parameters: string[] = []
  readonly directiveNames: string[] = []

  constructor(filepath: string, field: FieldDefinitionNode) {
    super(filepath, field.name.value)

    field.directives?.forEach((directive) => {
      this.directiveNames.push(directive.name.value)
    })

    const parameterNames = field.arguments?.map((arg) => {
      return arg.name.value
    })
    if (parameterNames !== undefined) {
      this.parameters.push(...parameterNames)
    }

    // Checks

    const knownDirectives = RedwoodProject.getProject({
      pathWithinProject: this.filepath,
    }).getDirectives()

    this.directiveNames.forEach((directiveName) => {
      const directiveExists = knownDirectives.some((knownDirective) => {
        return knownDirective.name === directiveName
      })
      if (!directiveExists) {
        this.errors.push(`Directive "${directiveName}" is not known`)
      }
    })
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
    sdl.errors.push(`Unabled to extract mutations because the gql is invalid`)
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
