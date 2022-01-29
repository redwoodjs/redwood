import {
  visit,
  DocumentNode,
  OperationTypeNode,
  OperationDefinitionNode,
  FieldNode,
  parse,
  InlineFragmentNode,
} from 'graphql'

interface Operation {
  operation: OperationTypeNode
  name: string | undefined
  fields: Array<string | Field>
}

interface Field {
  string: Array<string | Field>
}

export const parseGqlQueryToAst = (gqlQuery: string) => {
  const ast = parse(gqlQuery)
  return parseDocumentAST(ast)
}

export const parseDocumentAST = (document: DocumentNode) => {
  const operations: Array<Operation> = []

  visit(document, {
    OperationDefinition(node: OperationDefinitionNode) {
      const fields: any[] = []

      node.selectionSet.selections.forEach((field) => {
        fields.push(getFields(field as FieldNode))
      })

      operations.push({
        operation: node.operation,
        name: node.name?.value,
        fields,
      })
    },
  })

  return operations
}

const getFields = (field: FieldNode): any => {
  // base
  if (!field.selectionSet) {
    return field.name.value
  } else {
    const obj: Record<string, FieldNode[]> = {
      [field.name.value]: [],
    }

    const lookAtFieldNode = (node: FieldNode | InlineFragmentNode): void => {
      node.selectionSet?.selections.forEach((subField) => {
        switch (subField.kind) {
          case 'Field':
            obj[field.name.value].push(getFields(subField as FieldNode))
            break
          case 'FragmentSpread':
            // TODO: Maybe this will also be needed, right now it's accounted for to not crash in the tests
            break
          case 'InlineFragment':
            lookAtFieldNode(subField)
        }
      })
    }

    lookAtFieldNode(field)

    return obj
  }
}
