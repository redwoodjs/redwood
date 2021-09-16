import { DocumentNode, ObjectTypeDefinitionNode, visit } from 'graphql'

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
          const hasDirective = field.directives?.length
          if (!hasDirective) {
            validationOutput.push(`${field.name.value} ${typeNode.name.value}`)
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
