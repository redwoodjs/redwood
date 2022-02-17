import { Plugin } from '@envelop/types'
import {
  DirectiveNode,
  DocumentNode,
  getDirectiveValues,
  GraphQLObjectType,
  GraphQLResolveInfo,
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
  info: GraphQLResolveInfo,
  name: string
): null | DirectiveNode {
  try {
    const { parentType, fieldName, schema } = info
    const schemaType = schema.getType(parentType.name) as GraphQLObjectType
    const field = schemaType.getFields()[fieldName]
    const astNode = field.astNode
    const associatedDirective = astNode?.directives?.find(
      (directive) => directive.name.value === name
    )

    return associatedDirective || null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const useRedwoodDirective = (
  options: DirectivePluginOptions
): Plugin<{
  onResolverCalled: ValidatorDirectiveFunc | TransformerDirectiveFunc
}> => {
  return {
    async onResolverCalled({ args, root, context, info }) {
      const directiveNode = getDirectiveByName(info, options.name)
      const directive = directiveNode
        ? info.schema.getDirective(directiveNode.name.value)
        : null

      if (directiveNode && directive) {
        const directiveArgs =
          getDirectiveValues(
            directive,
            { directives: [directiveNode] },
            info.variableValues
          ) || {}

        if (_isValidator(options)) {
          await options.onResolverCalled({
            root,
            args,
            context,
            info,
            directiveNode,
            directiveArgs,
          })
        }

        // In order to change the value of the field, we have to return a function in this form
        // ({result, setResult}) => { setResult(newValue)}
        // Not super clear but mentioned here: https://www.envelop.dev/docs/plugins/lifecycle#onexecuteapi

        if (_isTransformer(options)) {
          return ({ result, setResult }) => {
            // @NOTE! A transformer cannot be async
            const transformedValue = options.onResolverCalled({
              root,
              args,
              context,
              info,
              directiveNode,
              directiveArgs,
              resolvedValue: result,
            })

            setResult(transformedValue)
          }
        }
      }

      return
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
