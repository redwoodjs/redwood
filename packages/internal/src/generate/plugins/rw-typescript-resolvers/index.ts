import {
  Types,
  PluginFunction,
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
  // This is the key change compared to the standard typescript-resolver
  // plugin implementation - we use our own Visitor here.
  // There are more changes done to this file, but they're all pretty much
  // all about just removing code that isn't needed for the specific
  // setup that Redwood has
  const visitor = new RwTypeScriptResolversVisitor(config, schema)

  // runs visitor
  const visitorResult = oldVisit(getCachedDocumentNodeFromSchema(schema), {
    leave: visitor as any,
  })

  const { prepend, content } = basePlugin(schema, [], config) as {
    prepend: string[]
    content: string
  }

  // A few types needed for our own RW-specific solution
  prepend.push(`export type OptArgsResolverFn<TResult, TParent, TContext, TArgs> = (
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>

    export type OptArgsResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = OptArgsResolverFn<TResult, TParent, TContext, TArgs>

    export type RequiredResolverFn<TResult, TParent, TContext, TArgs> = (
      args: TArgs,
      obj: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>

    export type RequiredResolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = RequiredResolverFn<TResult, TParent, TContext, TArgs>`)

  // `content` is constructed like this:
  //   content: [
  //     header,
  //     resolversTypeMapping,
  //     resolversParentTypeMapping,
  //     ...visitorResult.definitions.filter(
  //       (d: unknown) => typeof d === 'string'
  //     ),
  //     getRootResolver(),
  //     getAllDirectiveResolvers(),
  //   ].join('\n'),
  // We want to replace `visitorResult` with our own result.
  // `visitorResult` begins with "export type requireAuthDirectiveArgs = {"
  // We can execute `getRootResolver()` to know what that looks like.
  // Then we just replace whatever is between those two things with our own
  // result

  const splitContent = content.split('\n')
  const visitorResultStart = splitContent.indexOf(
    'export type requireAuthDirectiveArgs = {'
  )
  const splitRootResolver = visitor.getRootResolver().split('\n')
  const visitorResultEnd = splitContent.findIndex(
    (line: string, index: number) =>
      line === splitRootResolver[0] &&
      splitContent[index + 1] === splitRootResolver[1]
  )

  const newContent = [
    ...splitContent.slice(0, visitorResultStart),
    ...visitorResult.definitions.filter((d: unknown) => typeof d === 'string'),
    ...splitContent.slice(visitorResultEnd),
  ]

  return {
    prepend,
    content: newContent.join('\n'),
  }
}

export { RwTypeScriptResolversVisitor, TypeScriptResolversPluginConfig }
