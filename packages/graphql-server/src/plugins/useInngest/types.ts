import type { ExecutionResult, OnExecuteEventPayload } from '@envelop/core'
import type { RedactOptions } from 'fast-redact'
import { OperationTypeNode } from 'graphql'
import type { Inngest, EventPayload } from 'inngest'

/**
 * UseInngestPluginOptions
 *
 * @param inngestClient Inngest client
 * @param buildEventNameFunction Function to build the event name
 * @param buildEventNamePrefixFunction Function to build the event name prefix
 * @param buildUserContextFunction Function to build the user context
 * @param userContext User context
 * @param logging Logging
 * @param sendOperations Sendable operations
 * @param sendErrors Send errors
 * @param sendIntrospection Send introspection
 * @param sendAnonymousOperations Send anonymous operations
 * @param denylist Denylist
 * @param includeRawResult Include result data
 * @param redactRawResultOptions Redaction
 */
export interface UseInngestPluginOptions {
  inngestClient: Inngest<Record<string, EventPayload>>
  buildEventNameFunction?: BuildEventNameFunction
  buildEventNamePrefixFunction?: BuildEventNamePrefixFunction
  buildUserContextFunction?: BuildUserContextFunction
  logging?: boolean | UseInngestLogger | UseInngestLogLevel
  sendOperations?: SendableOperations
  sendErrors?: boolean
  sendIntrospection?: boolean
  sendAnonymousOperations?: boolean
  denylist?: { types?: string[]; schemaCoordinates?: string[] }
  includeRawResult?: boolean
  redactRawResultOptions?: RedactOptions
}

/**
 * UseInngestExecuteOptions
 *
 * @param params OnExecuteEventPayload
 * @param logger Logger
 */
export interface UseInngestExecuteOptions {
  params: OnExecuteEventPayload<ContextType>
  logger: UseInngestLogger
}

/**
 * UseInngestEventNameFunctionOptions
 *
 * @extends UseInngestExecuteOptions
 * @param documentString Document string
 * @param eventNamePrefix Event name prefix
 */
export interface UseInngestEventNameFunctionOptions
  extends UseInngestExecuteOptions {
  documentString?: string
  eventNamePrefix: string
}

/**
 * UseInngestEventNamePrefixFunctionOptions
 *
 * @extends UseInngestExecuteOptions
 */
export interface UseInngestEventNamePrefixFunctionOptions
  extends UseInngestExecuteOptions {}

/**
 * UseInngestEventOptions
 *
 * @extends UseInngestExecuteOptions
 * @param sendOperations Sendable operations
 * @param buildEventNamePrefixFunction Function to build the event name prefix
 */
export type UseInngestEventOptions = {
  documentString?: string
} & UseInngestExecuteOptions &
  Pick<
    UseInngestPluginOptions,
    'sendOperations' | 'buildEventNamePrefixFunction'
  >

/**
 * UseInngestDataOptions
 *
 * @extends UseInngestExecuteOptions
 * @extends UseInngestLoggerOptions
 * @omit inngestClient
 */
export type UseInngestDataOptions = {
  eventName: string
  result: ExecutionResult
} & UseInngestExecuteOptions &
  UseInngestLoggerOptions &
  Omit<
    UseInngestPluginOptions,
    | 'inngestClient'
    | 'buildEventNameFunction'
    | 'buildEventNamePrefixFunction'
    | 'buildUserContextFunction'
  >

/**
 * SendableOperations
 *
 * Sendable GraphQL operations are query, mutation, subscription
 */
export type SendableOperations = Iterable<'query' | 'mutation' | 'subscription'>

/**
 * UseInngestEntityRecord
 *
 * @param typename Entity typename
 * @param id Entity id
 */
export type UseInngestEntityRecord = {
  typename: string
  id?: number | string
}

/**
 * UseInngestLogLevel
 *
 * 'trace' | 'debug' | 'info' | 'warn' | 'error'
 */
export type UseInngestLogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

/**
 * UseInngestLogger
 *
 */
export type UseInngestLogger = Record<
  UseInngestLogLevel,
  (...args: any[]) => void
>

/**
 * InngestUserContext
 *
 */
export type InngestUserContext = Record<string, any> | undefined

/**
 * UseInngestUserContextOptions
 */
export type UseInngestUserContextOptions = UseInngestExecuteOptions &
  UseInngestLoggerOptions

/**
 * BuildUserContextFunction
 *
 * @param options UseInngestUserContextOptions
 */
export type BuildUserContextFunction = (
  options: UseInngestUserContextOptions
) => InngestUserContext | Promise<InngestUserContext>

/**
 * BuildEventNamePrefixFunction
 *
 * @param options UseInngestEventNamePrefixFunctionOptions
 * @returns Event name prefix
 */
export type BuildEventNamePrefixFunction = (
  options: UseInngestEventNamePrefixFunctionOptions
) => Promise<string>

/**
 * BuildEventNameFunction
 *
 * @param options UseInngestEventNameFunctionOptions
 * @returns Event name
 */

export type BuildEventNameFunction = (
  options: UseInngestEventNameFunctionOptions
) => Promise<string>

/**
 * UseInngestLoggerOptions
 *
 * @param logger Logger
 */
export type UseInngestLoggerOptions = {
  logger: UseInngestLogger
}
/**
 * ContextType
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ContextType = Record<string, any>

/**
 * OperationInfo
 *
 * @returns operationName and operationType
 */
export type OperationInfo = {
  operationName: string | undefined
  operationType: OperationTypeNode | 'unknown'
}
