import type { TypeScriptResolversPluginConfig } from '@graphql-codegen/typescript-resolvers';
import { TypeScriptResolversVisitor } from '@graphql-codegen/typescript-resolvers';
import type { FieldDefinitionNode, GraphQLSchema, ObjectTypeDefinitionNode } from 'graphql';
export declare class RwTypeScriptResolversVisitor extends TypeScriptResolversVisitor {
    constructor(pluginConfig: TypeScriptResolversPluginConfig, schema: GraphQLSchema);
    FieldDefinition(node: FieldDefinitionNode, key: string | number, parent: any): (parentName: string) => string | null;
    ObjectTypeDefinition(node: ObjectTypeDefinitionNode): string;
}
//# sourceMappingURL=visitor.d.ts.map