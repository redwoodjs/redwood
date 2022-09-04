import { CodegenPlugin } from '@graphql-codegen/plugin-helpers'
// import { getCachedDocumentNodeFromSchema } from '@graphql-codegen/plugin-helpers'
import { GraphQLSchema } from 'graphql'

const p: CodegenPlugin = {
  plugin(schema: GraphQLSchema, _documents: any, config: any) {
    console.log('schema', schema)
    console.log('documents', _documents)
    console.log('config', config)

    // const astNode = getCachedDocumentNodeFromSchema(schema) // Transforms the GraphQLSchema into ASTNode

    // const visitor = {
    //   FieldDefinition(node) {
    //     // This function triggered per each field
    //   },
    //   ObjectTypeDefinition(node) {
    //     // This function triggered per each type
    //   },
    // }

    const typesMap = schema.getTypeMap()

    return Object.keys(typesMap).join('\n')

    // return `
    // export type QueryResolvers<ContextType = RedwoodGraphQLContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
    //   contact: Resolver<Maybe<ResolversTypes['Contact']>, ParentType, ContextType, RequireFields<QuerycontactArgs, 'id'>>;
    //   contacts: OptArgsResolver<Array<ResolversTypes['Contact']>, ParentType, ContextType>;
    //   post: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QuerypostArgs, 'id'>>;
    //   posts: OptArgsResolver<Array<ResolversTypes['Post']>, ParentType, ContextType>;
    //   redwood: Resolver<Maybe<ResolversTypes['Redwood']>, ParentType, ContextType>;
    //   user: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryuserArgs, 'id'>>;
    // };
    // `
  },
}

export default p
