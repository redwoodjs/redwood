import type { DocumentNode, OperationTypeNode } from 'graphql';
interface Operation {
    operation: OperationTypeNode;
    name: string | undefined;
    fields: (string | Field)[];
}
interface Field {
    string: (string | Field)[];
}
export declare const parseGqlQueryToAst: (gqlQuery: string) => Operation[];
export declare const parseDocumentAST: (document: DocumentNode) => Operation[];
export declare const listQueryTypeFieldsInProject: () => Promise<string[]>;
export {};
//# sourceMappingURL=gql.d.ts.map