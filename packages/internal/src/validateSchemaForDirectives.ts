import path from 'path'

import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadSchema } from '@graphql-tools/load'
import { getDocumentNodeFromSchema } from '@graphql-tools/utils'
import { DocumentNode, ObjectTypeDefinitionNode, visit } from 'graphql'

import { ensurePosixPath, getPaths } from './paths'

export const DIRECTIVE_REQUIRED_ERROR_MESSAGE =
  'You must specify one of @requireAuth, @skipAuth or a custom directive'

export function validateSchemaForDirectives(
  schemaDocumentNode: DocumentNode,
  typesToCheck: string[] = ['Query', 'Mutation']
) {
  const validationOutput: string[] = []

  visit(schemaDocumentNode, {
    ObjectTypeDefinition(typeNode) {
      if (typesToCheck.includes(typeNode.name.value)) {
        for (const field of typeNode.fields ||
          ([] as ObjectTypeDefinitionNode[])) {
          const fieldName = field.name.value
          const fieldTypeName = typeNode.name.value

          // skip validation for redwood query
          if (fieldName === 'redwood' && fieldTypeName === 'Query') {
            return
          }

          const hasDirective = field.directives?.length
          if (!hasDirective) {
            validationOutput.push(`${fieldName} ${fieldTypeName}`)
          }
        }
      }
    },
  })

  if (validationOutput.length > 0) {
    const fieldsWithoutDirectives = validationOutput.map(
      (field) => `- ${field}`
    )

    throw new Error(
      `${DIRECTIVE_REQUIRED_ERROR_MESSAGE} for\n${fieldsWithoutDirectives.join(
        '\n'
      )}`
    )
  }
}

export const loadAndValidateSdls = async () => {
  const apiSrc = ensurePosixPath(getPaths().api.src)
  const schema = await loadSchema(
    [
      path.join(ensurePosixPath(__dirname), './rootGqlSchema.{js,ts}'), // support loading from either compiled JS or TS (for jest tests)
      path.join(apiSrc, 'graphql/**/*.sdl.{js,ts}'),
      path.join(apiSrc, 'directives/**/*.{js,ts}'),
    ],
    {
      loaders: [new CodeFileLoader()],
    }
  )

  validateSchemaForDirectives(getDocumentNodeFromSchema(schema))
}
