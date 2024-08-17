import type { DocumentNode } from 'graphql';
export declare const DIRECTIVE_REQUIRED_ERROR_MESSAGE = "You must specify one of @requireAuth, @skipAuth or a custom directive";
export declare const DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE = "Please check that the requireAuth roles is a string or an array of strings.";
/**
 * These are names that are commonly used in GraphQL schemas as scalars
 * and would cause a conflict if used as a type name.
 *
 * Note: Query, Mutation, and Subscription are not included here because
 * they are checked for separately.
 */
export declare const RESERVED_TYPES: string[];
export declare function validateSchema(schemaDocumentNode: DocumentNode, typesToCheck?: string[]): void;
export declare const loadAndValidateSdls: () => Promise<void>;
//# sourceMappingURL=validateSchema.d.ts.map