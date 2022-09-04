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

  const transformedSchema = config.federation
    ? addFederationReferencesToSchema(schema)
    : schema
  // This is the key change compared to the standard typescript-resolver
  // plugin implementation - we use our own Visitor here.
  // There are more changes done to this file, but they're all pretty much
  // all about just removing code that isn't needed for the specific
  // setup that Redwood has
  const visitor = new RwTypeScriptResolversVisitor(config, transformedSchema)
  const namespacedImportPrefix = visitor.config.namespacedImportName
    ? `${visitor.config.namespacedImportName}.`
    : ''

  const astNode = getCachedDocumentNodeFromSchema(transformedSchema)

  // runs visitor
  // TODO: Fix type
  const visitorResult = oldVisit(astNode, { leave: visitor as any })

  const optionalSignForInfoArg = visitor.config.optionalInfoArgument ? '?' : ''

  defsToInclude.push(
    'export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ' +
      'ResolverFn<TResult, TParent, TContext, TArgs>'
  )

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

  return {
    // We're spreading `prepend` and `content` here. `content` will be fully
    // overridden by our own content on the line below. Really only needed to
    // replace `visitorResult`, but couldn't figure out how to be more
    // granular than this
    ...basePlugin(schema, [], config),
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
