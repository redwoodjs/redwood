import { Plugin } from '@envelop/types'
import {
  defaultFieldResolver,
  DirectiveNode,
  GraphQLObjectType,
  GraphQLResolveInfo,
} from 'graphql'

import { GlobalContext } from '../index'

function isQueryOrMutation(info: GraphQLResolveInfo): boolean {
  const { parentType } = info

  return parentType.name === 'Query' || parentType.name === 'Mutation'
}

export const DIRECTIVE_REQUIRED_ERROR_MESSAGE =
  'You must specify one of @requireAuth, @skipAuth or a custom directive'

export interface DirectiveArgs<FieldType = any> {
  context: GlobalContext
  directiveNode?: DirectiveNode
  getFieldValue: () => FieldType
  root: unknown
  args: Record<string, unknown>
  info: GraphQLResolveInfo
}

/**
 * Write your directive logic inside this function.
 *
 * - Return your transformed value if you want to replace it. e.g. masking a field
 * - Throw an error, if you want to stop executing e.g. not sufficient permissions
 *
 */
export type RedwoodDirective<FieldType = any> = (
  args: DirectiveArgs<FieldType>
) => FieldType | Promise<void> | void

export type PluginOptions = {
  onExecute: RedwoodDirective
  name: string
}

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

// use this to get specific argument values
export function getDirectiveArgument(
  directive: DirectiveNode,
  argumentName: string
) {
  if (directive.kind === 'Directive') {
    const directiveArgs = directive.arguments?.filter(
      (d) => d.name.value === argumentName
    )

    if (directiveArgs) {
      const outputArgs =
        directiveArgs
          .values()
          .next()
          .value?.value?.values?.map((v: any) => v.value) || undefined

      return outputArgs
    }
  }

  return undefined
}

export const useRedwoodDirective = (
  options: PluginOptions
): Plugin<{
  onExecute: RedwoodDirective
}> => {
  const executeDirective = options.onExecute

  return {
    onExecute() {
      return {
        async onResolverCalled({ args, root, context, info }) {
          if (isQueryOrMutation(info) && !hasDirective(info)) {
            throw new Error(DIRECTIVE_REQUIRED_ERROR_MESSAGE)
          }

          const directiveNode = getDirectiveByName(info, options.name)

          if (directiveNode) {
            const transformedOutputMaybe = await executeDirective({
              context,
              directiveNode,
              getFieldValue: () =>
                defaultFieldResolver(root, args, context, info),
              args,
              root,
              info,
            })

            // In order to change the value of the field, we have to return a function in this form
            // ({result, setResult}) => { setResult(newValue)}
            // Not super clear but mentioned here: https://www.envelop.dev/docs/plugins/lifecycle#onexecuteapi

            if (transformedOutputMaybe) {
              return ({ setResult }) => {
                setResult(transformedOutputMaybe)
              }
            }
          }

          return
        },
      }
    },
  }
}
