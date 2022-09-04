// Copied from
// https://github.com/dotansimha/graphql-code-generator/blob/5efc9433431728f7bcb35d33b6d9e29c4313d4f0/packages/plugins/typescript/resolvers/src/config.ts

import { RawResolversConfig } from '@graphql-codegen/visitor-plugin-common'

/**
 * @description This plugin generates TypeScript signature for `resolve` functions of your GraphQL API.
 * You can use this plugin to generate simple resolvers signature based on your GraphQL types, or you can change its behavior be providing custom model types (mappers).
 *
 * You can find a blog post explaining the usage of this plugin here: https://the-guild.dev/blog/better-type-safety-for-resolvers-with-graphql-codegen
 *
 */
export interface TypeScriptResolversPluginConfig extends RawResolversConfig {
  /**
   * @description Adds an index signature to any generates resolver.
   * @default false
   *
   * @exampleMarkdown
   * ```yaml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - typescript-resolvers
   *     config:
   *       useIndexSignature: true
   * ```
   */
  useIndexSignature?: boolean
  /**
   * @description Disables/Enables Schema Stitching support.
   * By default, the resolver signature does not include the support for schema-stitching.
   * Set to `false` to enable that.
   *
   * @default true
   * @exampleMarkdown
   * ```yaml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - typescript-resolvers
   *     config:
   *       noSchemaStitching: false
   * ```
   */
  noSchemaStitching?: boolean
  /**
   * @description Set to `true` in order to wrap field definitions with `FieldWrapper`.
   * This is useful to allow return types such as Promises and functions. Needed for
   * compatibility with `federation: true` when
   * @default true
   */
  wrapFieldDefinitions?: boolean
  /**
   * @description You can provide your custom GraphQLResolveInfo instead of the default one from graphql-js
   * @default "graphql#GraphQLResolveInfo"
   *
   * @exampleMarkdown
   * ```yaml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - typescript-resolvers
   *     config:
   *       customResolveInfo: ./my-types#MyResolveInfo
   * ```
   */
  customResolveInfo?: string
  /**
   * @description You can provide your custom ResolveFn instead the default. It has to be a type that uses the generics `<TResult, TParent, TContext, TArgs>`
   * @default "(parent: TParent, args: TArgs, context: TContext, info: GraphQLResolveInfo) => Promise<TResult> | TResult"
   *
   * @exampleMarkdown
   * ## Custom Signature
   *
   * ```yaml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - typescript
   *       - typescript-resolvers
   *     config:
   *       customResolverFn: ./my-types#MyResolveFn
   * ```
   *
   * ## With Graphile
   *
   * ```yaml
   * generates:
   *   path/to/file.ts:
   *     plugins:
   *       - add:
   *           content: "import { GraphileHelpers } from 'graphile-utils/node8plus/fieldHelpers';"
   *       - typescript
   *       - typescript-resolvers
   *     config:
   *       customResolverFn: |
   *         (
   *           parent: TParent,
   *           args: TArgs,
   *           context: TContext,
   *           info: GraphQLResolveInfo & { graphile: GraphileHelpers<TParent> }
   *         ) => Promise<TResult> | TResult;
   * ```
   */
  customResolverFn?: string
  /**
   * @description Map the usage of a directive into using a specific resolver.
   * @exampleMarkdown
   * ```yaml
   *   config:
   *     customResolverFn: ../resolver-types.ts#UnauthenticatedResolver
   *     directiveResolverMappings:
   *       authenticated: ../resolvers-types.ts#AuthenticatedResolver
   * ```
   */
  directiveResolverMappings?: Record<string, string>
  /**
   * @description Allow you to override the `ParentType` generic in each resolver, by avoid enforcing the base type of the generated generic type.
   *
   * This will generate `ParentType = Type` instead of `ParentType extends Type = Type` in each resolver.
   *
   * @exampleMarkdown
   * ```yaml
   *   config:
   *     allowParentTypeOverride: true
   * ```
   *
   */
  allowParentTypeOverride?: boolean
  /**
   * @description Sets `info` argument of resolver function to be optional field. Useful for testing.
   *
   * @exampleMarkdown
   * ```yaml
   *   config:
   *     optionalInfoArgument: true
   * ```
   *
   */
  optionalInfoArgument?: boolean
  /**
   * @description Set to `true` in order to allow the Resolver type to be callable
   *
   * @exampleMarkdown
   * ```yaml
   *  config:
   *    makeResolverTypeCallable: true
   * ```
   */
  makeResolverTypeCallable?: boolean
}
