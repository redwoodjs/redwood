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
      // We're reusing pretty much all of the logic in the original plugin
      // Visitor implementation by calling the `super` method here
      const fieldDef = superFieldDefinition(parentName)

      // If this field doesn't take any arguments, and it is a resolver, then
      // we switch to using the OptArgsResolver type instead, so that the user
      // isn't forced to pass in arguments that aren't going to be used anyway
      if (!hasArguments && fieldDef?.includes(': Resolver<')) {
        return fieldDef.replace(': Resolver<', ': OptArgsResolver<')
      }

      return fieldDef
    }
  }
}
