import {
  TypeScriptResolversPluginConfig,
  TypeScriptResolversVisitor,
} from '@graphql-codegen/typescript-resolvers'
import { FieldDefinitionNode, GraphQLSchema } from 'graphql'

export class RwTypeScriptResolversVisitor extends TypeScriptResolversVisitor {
  constructor(
    pluginConfig: TypeScriptResolversPluginConfig,
    schema: GraphQLSchema
  ) {
    super(pluginConfig, schema)
  }

  FieldDefinition(
    node: FieldDefinitionNode,
    key: string | number,
    parent: any
  ): (parentName: string) => string | null {
    const hasArguments = node.arguments && node.arguments.length > 0

    const superFieldDefinition = super.FieldDefinition(node, key, parent)

    return (parentName: string) => {
      const fieldDef = superFieldDefinition(parentName)

      if (hasArguments && fieldDef?.includes(': Resolver<')) {
        return fieldDef.replace(': Resolver<', ': OptArgsResolver<')
      }

      return fieldDef
    }
  }
}
