import { FieldDefinitionNode } from 'graphql'

import { parseGraphQL } from '../../lib/gql'
import { RedwoodSkeleton } from '../skeleton'
import { RedwoodProject } from '../project'

import { RedwoodSDL } from './sdl'

export class RedwoodSDLQuery extends RedwoodSkeleton {
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

export function extractQueries(sdl: RedwoodSDL): RedwoodSDLQuery[] {
  const queries: RedwoodSDLQuery[] = []

  if (sdl.gql === undefined) {
    return queries
  }

  let gqlAST
  try {
    gqlAST = parseGraphQL(sdl.gql)
  } catch (_) {
    sdl.errors.push(`Unabled to extract queries because the gql is invalid`)
    return queries
  }

  gqlAST.definitions.forEach((definition) => {
    if (
      definition.kind === 'ObjectTypeDefinition' &&
      definition.name.value === 'Query'
    ) {
      definition.fields?.forEach((field) => {
        queries.push(new RedwoodSDLQuery(sdl.filepath, field))
      })
    }
  })

  return queries
}
