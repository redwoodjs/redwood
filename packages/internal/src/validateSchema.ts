import path from 'path'

import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadSchema } from '@graphql-tools/load'
import { getDocumentNodeFromSchema } from '@graphql-tools/utils'
import { DocumentNode, ObjectTypeDefinitionNode, visit } from 'graphql'

import { getPaths } from './paths'

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

          const isRedwoodQuery =
            fieldName === 'redwood' && fieldTypeName === 'Query'
          const isCurrentUserQuery =
            fieldName === 'currentUser' && fieldTypeName === 'Query'
          // skip validation for redwood query and currentUser
          if (isRedwoodQuery || isCurrentUserQuery) {
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
  const projectSchema = await loadSchema(
    [
      path.join(__dirname, './rootGqlSchema.js'), // support loading from either compiled JS
      path.join(__dirname, './rootGqlSchema.ts'), // or TS (for jest tests)
      'graphql/**/*.sdl.{js,ts}',
      'directives/**/*.{js,ts}',
    ],
    {
      loaders: [
        new CodeFileLoader({
          noRequire: true,
          pluckConfig: {
            globalGqlIdentifierName: 'gql',
          },
        }),
      ],
      cwd: getPaths().api.src,
    }
  )

  validateSchemaForDirectives(getDocumentNodeFromSchema(projectSchema))
}
