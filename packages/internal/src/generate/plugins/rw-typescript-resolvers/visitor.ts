import {
  TypeScriptResolversPluginConfig,
  TypeScriptResolversVisitor,
} from '@graphql-codegen/typescript-resolvers'
import {
  indent,
  DeclarationBlock,
} from '@graphql-codegen/visitor-plugin-common'
import {
  FieldDefinitionNode,
  GraphQLSchema,
  ObjectTypeDefinitionNode,
} from 'graphql'

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
        return fieldDef.replace(': Resolver<', ': OptArgsResolverFn<')
      }

      return fieldDef
    }
  }

  // This is mostly copy/paste from
  // https://github.com/dotansimha/graphql-code-generator/blob/c6c60a3078f3797af435c3852220d8898964031d/packages/plugins/other/visitor-plugin-common/src/base-resolvers-visitor.ts#L1091
  // Just duplicating every block to get RequiredResolver types for use with
  // our relation resolvers
  ObjectTypeDefinition(node: ObjectTypeDefinitionNode): string {
    const declarationKind = 'type'
    const name = this.convertName(node, {
      suffix: this.config.resolverTypeSuffix,
    })
    const typeName = node.name as any as string
    const parentType = this.getParentTypeToUse(typeName)
    const isRootType = [
      this.schema.getQueryType()?.name,
      this.schema.getMutationType()?.name,
      this.schema.getSubscriptionType()?.name,
    ].includes(typeName)

    const fieldsContent = (node.fields || []).map((f: any) => f(node.name))

    if (!isRootType) {
      fieldsContent.push(
        indent(
          `${
            this.config.internalResolversPrefix
          }isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>${this.getPunctuation(
            declarationKind
          )}`
        )
      )
    }

    const block = new DeclarationBlock(this._declarationBlockConfig)
      .export()
      .asKind(declarationKind)
      .withName(
        name,
        `<ContextType = ${
          this.config.contextType.type
        }, ${this.transformParentGenericType(parentType)}>`
      )
      .withBlock(fieldsContent.join('\n'))

    // This is what's different compared to the implementation I copy/pasted
    // We create a new block with a different type called
    // "ModelRelationResolver" where "Model" is the name of a prisma model.
    // We also replace all Resolver types with RelationResolver types where
    // all arguments are required
    //
    // It can look like this:
    //   export type PostRelationResolvers<ContextType = RedwoodGraphQLContext, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = {
    //     author: RelationResolver<ResolversTypes['User'], ParentType, ContextType>;
    //     authorId: RelationResolver<ResolversTypes['Int'], ParentType, ContextType>;
    //     body: RelationResolver<ResolversTypes['String'], ParentType, ContextType>;
    //     createdAt: RelationResolver<ResolversTypes['DateTime'], ParentType, ContextType>;
    //     id: RelationResolver<ResolversTypes['Int'], ParentType, ContextType>;
    //     title: RelationResolver<ResolversTypes['String'], ParentType, ContextType>;
    //     __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
    //   };
    const blockRelationsResolver = new DeclarationBlock(
      this._declarationBlockConfig
    )
      .export()
      .asKind(declarationKind)
      .withName(
        name.replace('Resolver', 'RelationResolver'),
        `<ContextType = ${
          this.config.contextType.type
        }, ${this.transformParentGenericType(parentType)}>`
      )
      .withBlock(
        fieldsContent
          .map((content) =>
            content.replace(
              /: (?:OptArgs)?Resolver(?:Fn)?/,
              ': RequiredResolverFn'
            )
          )
          .join('\n')
      )

    this._collectedResolvers[node.name as any] = name + '<ContextType>'

    return block.string + '\n' + blockRelationsResolver.string
  }
}
