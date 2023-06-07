import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadSchema } from '@graphql-tools/load'
import { UrlLoader } from '@graphql-tools/url-loader'
import {
  DocumentNode,
  FieldNode,
  GraphQLSchema,
  InlineFragmentNode,
  OperationDefinitionNode,
  OperationTypeNode,
  parse,
  print,
  visit,
} from 'graphql'

import { rootSchema } from '@redwoodjs/graphql-server'
import { getConfig, getPaths } from '@redwoodjs/project-config'

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

export const listQueryTypeFieldsInProject = async () => {
  try {
    let schema: GraphQLSchema

    const remoteSchema = getConfig().web.graphQLSchema
    if (remoteSchema) {
      schema = await loadSchema(remoteSchema, {
        loaders: [new UrlLoader(), new GraphQLFileLoader()],
      })
    } else {
      const schemaPointerMap = {
        [print(rootSchema.schema)]: {},
        'graphql/**/*.sdl.{js,ts}': {},
        'directives/**/*.{js,ts}': {},
        'subscriptions/**/*.{js,ts}': {},
      }

      schema = await loadSchema(schemaPointerMap, {
        loaders: [
          new CodeFileLoader({
            noRequire: true,
            pluckConfig: {
              globalGqlIdentifierName: 'gql',
            },
          }),
        ],
        cwd: getPaths().api.src,
        assumeValidSDL: true,
      })
    }

    const queryTypeFields = schema.getQueryType()?.getFields()

    // Return empty array if no schema found
    return Object.keys(queryTypeFields ?? {})
  } catch (e) {
    console.error(e)
    return []
  }
}
