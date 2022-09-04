// Copied from
// https://github.com/dotansimha/graphql-code-generator/blob/5efc9433431728f7bcb35d33b6d9e29c4313d4f0/packages/plugins/typescript/resolvers/src/index.ts
// and then modified

import {
  Types,
  PluginFunction,
  addFederationReferencesToSchema,
  getCachedDocumentNodeFromSchema,
  oldVisit,
} from '@graphql-codegen/plugin-helpers'
import {
  TypeScriptResolversPluginConfig,
  plugin as basePlugin,
} from '@graphql-codegen/typescript-resolvers'
import { GraphQLSchema } from 'graphql'

import { RwTypeScriptResolversVisitor } from './visitor.js'

export const plugin: PluginFunction<
  TypeScriptResolversPluginConfig,
  Types.ComplexPluginOutput
> = (
  schema: GraphQLSchema,
  _documents: Types.DocumentFile[],
  config: TypeScriptResolversPluginConfig
) => {
  const imports = []
  if (!config.customResolveInfo) {
    imports.push('GraphQLResolveInfo')
  }

  const indexSignature = config.useIndexSignature
    ? [
        'export type WithIndex<TObject> = TObject & Record<string, any>;',
        'export type ResolversObject<TObject> = WithIndex<TObject>;',
      ].join('\n')
    : ''
  const defsToInclude: string[] = []

  defsToInclude.push(
    'export type OptArgsResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = OptArgsResolverFn<TResult, TParent, TContext, TArgs>'
  )

  const transformedSchema = config.federation
    ? addFederationReferencesToSchema(schema)
    : schema
  const visitor = new RwTypeScriptResolversVisitor(config, transformedSchema)
  const namespacedImportPrefix = visitor.config.namespacedImportName
    ? `${visitor.config.namespacedImportName}.`
    : ''

  const astNode = getCachedDocumentNodeFromSchema(transformedSchema)

  // runs visitor
  // TODO: Fix type
  const visitorResult = oldVisit(astNode, { leave: visitor as any })

  const optionalSignForInfoArg = visitor.config.optionalInfoArgument ? '?' : ''
  const resolverType = `export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =`
  const resolverFnUsage = `ResolverFn<TResult, TParent, TContext, TArgs>`

  if (visitor.hasFederation()) {
    if (visitor.config.wrapFieldDefinitions) {
      defsToInclude.push(`export type UnwrappedObject<T> = {
        [P in keyof T]: T[P] extends infer R | Promise<infer R> | (() => infer R2 | Promise<infer R2>)
          ? R & R2 : T[P]
      };`)
    }

    defsToInclude.push(`export type ReferenceResolver<TResult, TReference, TContext> = (
      reference: TReference,
      context: TContext,
      info${optionalSignForInfoArg}: GraphQLResolveInfo
    ) => Promise<TResult> | TResult;`)

    defsToInclude.push(`
      type ScalarCheck<T, S> = S extends true ? T : NullableCheck<T, S>;
      type NullableCheck<T, S> = ${namespacedImportPrefix}Maybe<T> extends T ? ${namespacedImportPrefix}Maybe<ListCheck<NonNullable<T>, S>> : ListCheck<T, S>;
      type ListCheck<T, S> = T extends (infer U)[] ? NullableCheck<U, S>[] : GraphQLRecursivePick<T, S>;
      export type GraphQLRecursivePick<T, S> = { [K in keyof T & keyof S]: ScalarCheck<T[K], S[K]> };
    `)
  }

  defsToInclude.push(`${resolverType} ${resolverFnUsage};`)

  const header = `${indexSignature}

${visitor.getResolverTypeWrapperSignature()}

${defsToInclude.join('\n')}

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info${optionalSignForInfoArg}: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info${optionalSignForInfoArg}: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info${optionalSignForInfoArg}: GraphQLResolveInfo
) => ${namespacedImportPrefix}Maybe<TTypes> | Promise<${namespacedImportPrefix}Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info${optionalSignForInfoArg}: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info${optionalSignForInfoArg}: GraphQLResolveInfo
) => TResult | Promise<TResult>;
`

  const resolversTypeMapping = visitor.buildResolversTypes()
  const resolversParentTypeMapping = visitor.buildResolversParentTypes()
  const { getRootResolver, getAllDirectiveResolvers, hasScalars } = visitor

  if (hasScalars()) {
    imports.push('GraphQLScalarType', 'GraphQLScalarTypeConfig')
  }

  const { prepend } = basePlugin(schema, [], config) as { prepend: string[] }
  prepend.push(`export type OptArgsResolverFn<TResult, TParent, TContext, TArgs> = (
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`)

  return {
    prepend,
    content: [
      header,
      resolversTypeMapping,
      resolversParentTypeMapping,
      ...visitorResult.definitions.filter(
        (d: unknown) => typeof d === 'string'
      ),
      getRootResolver(),
      getAllDirectiveResolvers(),
    ].join('\n'),
  }
}

export { RwTypeScriptResolversVisitor, TypeScriptResolversPluginConfig }
