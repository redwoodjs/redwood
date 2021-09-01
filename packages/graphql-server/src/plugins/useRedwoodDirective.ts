import { Plugin } from '@envelop/types'
import type { Context as LambdaContext } from 'aws-lambda'
import { DirectiveNode, GraphQLObjectType, GraphQLResolveInfo } from 'graphql'

function isQueryOrMutation(info: GraphQLResolveInfo): boolean {
  const { parentType } = info

  return parentType.name === 'Query' || parentType.name === 'Mutation'
}

export const DIRECTIVE_REQUIRED_ERROR_MESSAGE =
  'You must specify one of @requireAuth, @skipAuth or a custom directive'

export type DirectiveImplementationFunction = (
  resolverInfo?: {
    root: unknown
    context: LambdaContext
    args: Record<string, unknown>
    info: GraphQLResolveInfo
  },
  directiveNode?: DirectiveNode
) => void | Promise<void>

export type RedwoodDirectivePluginOptions = {
  onExecute: DirectiveImplementationFunction
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
  options: RedwoodDirectivePluginOptions
): Plugin<{
  onExecute: DirectiveImplementationFunction
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
            await executeDirective(
              {
                info,
                context: context as unknown as LambdaContext,
                args,
                root,
              },
              directiveNode
            )
          }
        },
      }
    },
  }

  return {}
}
