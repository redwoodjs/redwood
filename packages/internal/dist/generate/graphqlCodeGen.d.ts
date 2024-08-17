import type { LoadTypedefsOptions } from '@graphql-tools/load';
type TypeDefResult = {
    typeDefFiles: string[];
    errors: {
        message: string;
        error: unknown;
    }[];
};
export declare const generateTypeDefGraphQLApi: () => Promise<TypeDefResult>;
export declare const generateTypeDefGraphQLWeb: () => Promise<TypeDefResult>;
export declare function getLoadDocumentsOptions(filename: string): LoadTypedefsOptions<{
    cwd: string;
}>;
export declare const getResolverFnType: () => "(\n      args: TArgs,\n      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }\n    ) => TResult | Promise<TResult>" | "(\n      args?: TArgs,\n      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }\n    ) => TResult | Promise<TResult>";
export {};
//# sourceMappingURL=graphqlCodeGen.d.ts.map