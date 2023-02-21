import type { OnExecuteEventPayload } from '@envelop/core'
import { visitResult } from '@graphql-tools/utils'
import {
  visit,
  getNamedType,
  getOperationAST,
  isIntrospectionType,
  TypeInfo,
  visitWithTypeInfo,
  BREAK,
  ExecutionResult,
  GraphQLType,
} from 'graphql'

import type {
  ContextType,
  UseInngestExecuteOptions,
  UseInngestEventOptions,
  UseInngestDataOptions,
  UseInngestEntityRecord,
  OperationInfo,
} from './types'

/**
 * getOperationInfo
 *
 * Gets the operation name and type from document
 *
 * @param options Pick<UseInngestExecuteOptions, 'params'>
 * @returns string | undefined
 */
export const getOperationInfo = (
  options: Pick<UseInngestExecuteOptions, 'params'>
): OperationInfo => {
  const operationAST = getOperationAST(options.params.args.document)
  return {
    operationName: operationAST?.name?.value || undefined,
    operationType: operationAST?.operation ?? 'unknown',
  }
}

/**
 * sendOperation
 *
 * Determines if the operation is allowed to be sent to Inngest
 *
 * @param options UseInngestEventOptions
 * @returns boolean
 */
export const sendOperation = (options: UseInngestEventOptions): boolean => {
  if (!options.sendOperations === undefined) {
    options.logger.warn('No operations are allowed.')
  }
  const ops = new Set(options.sendOperations)

  const { operationName, operationType } = getOperationInfo(options)

  if (operationType === 'unknown') {
    options.logger.warn('Unknown operation')
    return false
  }

  const allow = ops.has(operationType)

  if (!allow) {
    options.logger.warn(
      `Operation ${operationType} named ${operationName} is not allowed`
    )
  }

  return allow
}

/**
 * isAnonymousOperation
 *
 * Determines if the operation is anonymous
 *
 * @param params
 * @returns boolean
 */
export const isAnonymousOperation = (
  params: OnExecuteEventPayload<ContextType>
) => {
  return getOperationInfo({ params }).operationName === undefined
}

/**
 * isIntrospectionQuery
 *
 * Determines if the operation is an introspection query
 *
 * @param params
 * @returns boolean
 */
export const isIntrospectionQuery = (
  params: OnExecuteEventPayload<ContextType>
) => {
  const typeInfo = new TypeInfo(params?.args?.schema)
  let isIntrospection = false

  visit(
    params.args.document,
    visitWithTypeInfo(typeInfo, {
      Field() {
        const type = typeInfo && getNamedType(typeInfo.getType() as GraphQLType)
        if (type && isIntrospectionType(type)) {
          isIntrospection = true
          return BREAK
        }
      },
    })
  )

  return isIntrospection
}

/**
 * buildTypeIdentifiers
 *
 * Builds a list of types and identifiers from the result data.
 *
 * Example: { types: ['Post'], identifiers: [{ id: 1, typename: 'Post }] }

 * @param options UseInngestDataOptions
 * @returns Object with list of types and identifiers
 *
 *
 */
export const buildTypeIdentifiers = async (options: UseInngestDataOptions) => {
  const idFields: Array<string> = ['id']

  const documentChanged = false // todo?

  const identifierSet = new Map<string, UseInngestEntityRecord>()
  const typeSet = new Set<string>()

  visitResult(
    options.result as ExecutionResult,
    {
      document: options.params.args.document,
      variables: options.params.args.variableValues as any,
      operationName: getOperationInfo(options).operationName,
      rootValue: options.params.args.rootValue,
      context: options.params.args.contextValue,
    },
    options.params.args.schema,
    new Proxy(
      {},
      {
        get(_, typename: string) {
          let typenameCalled = 0
          return new Proxy((val: any) => val, {
            // Needed for leaf values such as scalars, enums etc
            // They don't have fields so visitResult expects functions for those
            apply(_, __, [val]) {
              return val
            },
            get(_, fieldName: string) {
              if (documentChanged) {
                if (fieldName === '__typename') {
                  typenameCalled++
                }
                if (
                  fieldName === '__leave' &&
                  /**
                   * The visitResult function is called for each field in the selection set.
                   * But visitResult function looks for __typename field visitor even if it is not there in the document
                   * So it calls __typename field visitor twice if it is also in the selection set.
                   * That's why we need to count the number of times it is called.
                   *
                   * Default call of __typename https://github.com/ardatan/graphql-tools/blob/master/packages/utils/src/visitResult.ts#L277
                   * Call for the field node https://github.com/ardatan/graphql-tools/blob/master/packages/utils/src/visitResult.ts#L272
                   */ typenameCalled < 2
                ) {
                  return (root: any) => {
                    delete root.__typename
                    return root
                  }
                }
              }

              if (idFields.includes(fieldName)) {
                return (id: string) => {
                  identifierSet.set(`${typename}:${id}`, { typename, id })
                  typeSet.add(typename)
                  return id
                }
              }

              return undefined
            },
          })
        },
      }
    )
  )

  const identifiers = Array.from(identifierSet.values())
  const types = Array.from(typeSet.values())

  return { types, identifiers }
}

/**
 * denyType
 *
 * Determines if the event should be sent based on a deny list of types
 *
 * @param options UseInngestDataOptions
 * @returns boolean
 */
export const denyType = (options: UseInngestDataOptions) => {
  const typeInfo = new TypeInfo(options.params?.args?.schema)
  let hasType = false
  const typeDenyList = options.denylist?.types ?? []

  visit(
    options.params.args.document,
    visitWithTypeInfo(typeInfo, {
      Field() {
        const type = typeInfo && getNamedType(typeInfo.getType() as GraphQLType)
        if (type && typeDenyList.includes(type?.name)) {
          hasType = true
          return BREAK
        }
      },
    })
  )

  return hasType

  return false
}

/**
 * denySchemaCoordinate
 *
 * Determines if the event should be sent based on a deny list of schema coordinates
 *
 * @param options UseInngestDataOptions
 * @returns boolean
 */
export const denySchemaCoordinate = (options: UseInngestDataOptions) => {
  let hasSchemaCoordinate = false
  const typeInfo = new TypeInfo(options.params.args.schema)
  const schemaCoordinateDenyList = options.denylist?.schemaCoordinates ?? []

  visit(
    options.params.args.document,
    visitWithTypeInfo(typeInfo, {
      Field(fieldNode) {
        const parentType = typeInfo.getParentType()
        if (parentType) {
          const schemaCoordinate = `${parentType.name}.${fieldNode.name.value}`
          if (schemaCoordinateDenyList.includes(schemaCoordinate)) {
            hasSchemaCoordinate = true
            return BREAK
          }
        }
      },
    })
  )

  return hasSchemaCoordinate
}
