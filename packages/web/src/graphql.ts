import { DocumentNode } from 'graphql'

export function getOperationName(document: DocumentNode) {
  for (const definition of document.definitions) {
    if (definition.kind === 'OperationDefinition' && definition.name?.value) {
      return definition.name.value
    }
  }

  return ''
}
