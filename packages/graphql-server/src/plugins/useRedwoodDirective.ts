import { Plugin } from '@envelop/types'
import { mapSchema, MapperKind } from '@graphql-tools/utils'
import {
  defaultFieldResolver,
  DirectiveNode,
  DocumentNode,
  getDirectiveValues,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
} from 'graphql'

import { GlobalContext } from '../index'

export interface DirectiveParams<FieldType = any> {
  root: unknown
  args: Record<string, unknown>
  context: GlobalContext
  info: GraphQLResolveInfo
  directiveNode?: DirectiveNode
  directiveArgs: Record<string, any>
  resolvedValue: FieldType
}

/**
 * Write your validation logic inside this function.
 * Validator directives do not have access to the field value, i.e. they are called before resolving the value
 *
 * - Throw an error, if you want to stop executing e.g. not sufficient permissions
 * - Validator directives can be async or sync
 * - Returned value will be ignored
 */
export type ValidatorDirectiveFunc<FieldType = any> = (
  args: Omit<DirectiveParams<FieldType>, 'resolvedValue'>
) => Promise<void> | void

/**
 * Write your transformation logic inside this function.
 * Transformer directives run **after** resolving the value
 *
 * - You can also throw an error, if you want to stop executing, but note that the value has already been resolved
 * - Transformer directives **must** be synchonous, and return a value
 *
 */
export type TransformerDirectiveFunc<FieldType = any> = (
  args: DirectiveParams<FieldType>
) => FieldType

// @NOTE don't use unspecified enums, because !type would === true
export enum DirectiveType {
  VALIDATOR = 'VALIDATOR_DIRECTIVE',
  TRANSFORMER = 'TRANSFORMER_DIRECTIVE',
}

export type RedwoodDirective = ValidatorDirective | TransformerDirective

export interface ValidatorDirective extends ValidatorDirectiveOptions {
  schema: DocumentNode
}

export interface TransformerDirective extends TransformerDirectiveOptions {
  schema: DocumentNode
}

interface ValidatorDirectiveOptions {
  onResolverCalled: ValidatorDirectiveFunc
  type: DirectiveType.VALIDATOR
  name: string
}

interface TransformerDirectiveOptions {
  onResolverCalled: TransformerDirectiveFunc
  type: DirectiveType.TRANSFORMER
  name: string
}

export type DirectivePluginOptions =
  | ValidatorDirectiveOptions
  | TransformerDirectiveOptions

export function hasDirective(info: GraphQLResolveInfo): boolean {
  try {
    const { parentType, fieldName, schema } = info
    const schemaType = schema.getType(parentType.name) as GraphQLObjectType
    const field = schemaType.getFields()[fieldName]
    const astNode = field.astNode
    // if directives array exists, we check the length
    // other wise false
    return !!astNode?.directives?.length
  } catch (error) {
    console.error(error)
    return false
  }
}

export function getDirectiveByName(
  fieldConfig: GraphQLFieldConfig<any, any, any>,
  directiveName: string
): null | DirectiveNode {
  const associatedDirective = fieldConfig.astNode?.directives?.find(
    (directive) => directive.name.value === directiveName
  )
  return associatedDirective ?? null
}

export function isPromise(value: any): value is Promise<unknown> {
  return typeof value?.then === 'function'
}

function wrapAffectedResolvers(
  schema: GraphQLSchema,
  options: DirectivePluginOptions
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD](fieldConfig, _, __, schema) {
      const directiveNode = getDirectiveByName(fieldConfig, options.name)
      const directive = directiveNode
        ? schema.getDirective(directiveNode.name.value)
        : null
      if (directiveNode && directive) {
        const directiveArgs =
          getDirectiveValues(directive, { directives: [directiveNode] }) || {}
        const originalResolve = fieldConfig.resolve ?? defaultFieldResolver
        if (_isValidator(options)) {
          return {
            ...fieldConfig,
            resolve: function useRedwoodDirectiveValidatorResolver(
              root,
              args,
              context,
              info
            ) {
              const result = options.onResolverCalled({
                root,
                args,
                context,
                info,
                directiveNode,
                directiveArgs,
              })

              if (isPromise(result)) {
                return result.then(() =>
                  originalResolve(root, args, context, info)
                )
              }
              return originalResolve(root, args, context, info)
            },
          }
        }
        if (_isTransformer(options)) {
          return {
            ...fieldConfig,
            resolve: function useRedwoodDirectiveTransformerResolver(
              root,
              args,
              context,
              info
            ) {
              const resolvedValue = originalResolve(root, args, context, info)
              if (isPromise(resolvedValue)) {
                return resolvedValue.then((resolvedValue) =>
                  options.onResolverCalled({
                    root,
                    args,
                    context,
                    info,
                    directiveNode,
                    directiveArgs,
                    resolvedValue,
                  })
                )
              }
              return options.onResolverCalled({
                root,
                args,
                context,
                info,
                directiveNode,
                directiveArgs,
                resolvedValue,
              })
            },
          }
        }
      }
      return fieldConfig
    },
  })
}

export type useRedwoodDirectiveReturn = Plugin<{
  onResolverCalled: ValidatorDirectiveFunc | TransformerDirectiveFunc
}>

export const useRedwoodDirective = (
  options: DirectivePluginOptions
): useRedwoodDirectiveReturn => {
  /**
   * This symbol is added to the schema extensions for checking whether the transform got already applied.
   */
  const didMapSchemaSymbol = Symbol('useRedwoodDirective.didMapSchemaSymbol')
  return {
    onSchemaChange({ schema, replaceSchema }) {
      /**
       * Currently graphql-js extensions typings are limited to string keys.
       * We are using symbols as each useRedwoodDirective plugin instance should use its own unique symbol.
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error See https://github.com/graphql/graphql-js/pull/3511 - remove this comments once merged
      if (schema.extensions?.[didMapSchemaSymbol] === true) {
        return
      }
      const transformedSchema = wrapAffectedResolvers(schema, options)
      transformedSchema.extensions = {
        ...schema.extensions,
        [didMapSchemaSymbol]: true,
      }
      replaceSchema(transformedSchema)
    },
  }
}

// For narrowing types
const _isValidator = (
  options: DirectivePluginOptions
): options is ValidatorDirectiveOptions => {
  return options.type === DirectiveType.VALIDATOR
}

const _isTransformer = (
  options: DirectivePluginOptions
): options is TransformerDirectiveOptions => {
  return options.type === DirectiveType.TRANSFORMER
}
