import { Plugin } from '@envelop/core'
import { handleStreamOrSingleExecutionResult } from '@envelop/types'
import { ExecutionResult, Kind, OperationDefinitionNode } from 'graphql'
import type P from 'pino'
import { v4 as uuidv4 } from 'uuid'

import { AuthenticationError, ForbiddenError } from '../errors'
import { RedwoodGraphQLContext } from '../functions/types'

/**
 * Options for request and response information to include in the log statements
 * output by UseRedwoodLogger around the execution event
 *
 * @param level - Sets log level specific to GraphQL log output. Defaults to current logger level.
 * @param data - Include response data sent to client.
 * @param operationName - Include operation name.
 * @param requestId - Include the event's requestId, or if none, generate a uuid as an identifier.
 * @param query - Include the query. This is the query or mutation (with fields) made in the request.
 * @param tracing - Include the tracing and timing information.
 * @param userAgent - Include the browser (or client's) user agent.
 * @param excludeOperations - Exclude the specified operations from being logged.
 *
 */
type GraphQLLoggerOptions = {
  /**
   * Sets log level for GraphQL logging.
   * This level setting can be different than the one used in api side logging.
   * Defaults to the same level as the logger unless set here.
   *
   * Available log levels:
   *
   * - 'fatal'
   * - 'error'
   * - 'warn'
   * - 'info'
   * - 'debug'
   * - 'trace'
   * - 'silent'
   *
   * The logging level is a __minimum__ level. For instance if `logger.level` is `'info'` then all `'fatal'`, `'error'`, `'warn'`,
   * and `'info'` logs will be enabled.
   *
   * You can pass `'silent'` to disable logging.
   *
   * @default level of the logger set in LoggerConfig
   *
   */
  level?: P.LevelWithSilent | string

  /**
   * @description Include response data sent to client.
   */
  data?: boolean

  /**
   * @description Include operation name.
   *
   * The operation name is a meaningful and explicit name for your operation. It is only required in multi-operation documents,
   * but its use is encouraged because it is very helpful for debugging and server-side logging.
   * When something goes wrong (you see errors either in your network logs, or in the logs of your GraphQL server)
   * it is easier to identify a query in your codebase by name instead of trying to decipher the contents.
   * Think of this just like a function name in your favorite programming language.
   *
   * @see https://graphql.org/learn/queries/#operation-name
   */
  operationName?: boolean

  /**
   * @description Include the event's requestId, or if none, generate a uuid as an identifier.
   *
   * The requestId can be helpful when contacting your deployment provider to resolve issues when encountering errors or unexpected behavior.
   */
  requestId?: boolean

  /**
   * @description Include the query. This is the query or mutation (with fields) made in the request.
   */
  query?: boolean

  /**
   * @description Include the tracing and timing information.
   *
   * This will log various performance timings withing the GraphQL event lifecycle (parsing, validating, executing, etc).
   */
  tracing?: boolean

  /**
   * @description Include the browser (or client's) user agent.
   *
   * This can be helpful to know what type of client made the request to resolve issues when encountering errors or unexpected behavior.
   */
  userAgent?: boolean

  /**
   * @description Exclude operation from the log output.
   *
   * This is useful when you want to filter out certain operations from the log output.
   * For example `IntrospectionQuery` from GraphQL playground.
   */
  excludeOperations?: string[]
}

/**
 * Configure the logger used by the GraphQL server.
 *
 * @param logger your logger
 * @param options the GraphQLLoggerOptions such as tracing, operationName, etc
 */
export type LoggerConfig = {
  logger: P.BaseLogger | P.LoggerExtras
  options?: GraphQLLoggerOptions
}

/**
 * This function is used by the useRedwoodLogger to
 * logs every time an operation is being executed and
 * when the execution of the operation is done.
 */
const logResult =
  (
    loggerConfig: LoggerConfig,
    envelopLogger: P.BaseLogger,
    operationName: string
  ) =>
  ({ result }: { result: ExecutionResult }) => {
    const includeTracing = loggerConfig?.options?.tracing
    const includeData = loggerConfig?.options?.data

    const options = {} as any

    if (result?.errors && result?.errors.length > 0) {
      result.errors.forEach((error) => {
        if (
          error.originalError &&
          (error.originalError instanceof AuthenticationError ||
            error.originalError instanceof ForbiddenError)
        ) {
          envelopLogger.warn(
            {
              error,
            },
            `'${error?.extensions?.code || 'authentication'}' error '${
              error.message
            }' occurred in ${operationName}`
          )
        } else {
          envelopLogger.error(
            {
              error,
            },
            error.message || `Error in GraphQL execution: ${operationName}`
          )
        }
      })
    }

    if (result?.data) {
      if (includeData) {
        options['data'] = result.data
      }

      if (includeTracing) {
        options['tracing'] = result.extensions?.envelopTracing
      }

      envelopLogger.debug(
        {
          ...options,
        },
        `GraphQL execution completed: ${operationName}`
      )
    }
  }

/**
 * This plugin logs every time an operation is being executed and
 * when the execution of the operation is done.
 *
 * It adds information using a child logger from the context
 * such as the operation name, request id, errors, and header info
 * to help trace and diagnose issues.
 *
 * Tracing and timing information can be enabled via the
 * GraphQLHandlerOptions traction option.
 *
 * @see https://www.envelop.dev/docs/plugins/lifecycle
 * @returns
 */
export const useRedwoodLogger = (
  loggerConfig: LoggerConfig
): Plugin<RedwoodGraphQLContext> => {
  const logger = loggerConfig.logger as P.BaseLogger
  const loggerExtras = loggerConfig.logger as P.LoggerExtras
  const level = loggerConfig.options?.level || logger.level || 'warn'

  const childLogger = loggerExtras.child({
    name: 'graphql-server',
  })

  childLogger.level = level

  const includeOperationName = loggerConfig?.options?.operationName
  const includeRequestId = loggerConfig?.options?.requestId
  const includeUserAgent = loggerConfig?.options?.userAgent
  const includeQuery = loggerConfig?.options?.query
  const excludeOperations = loggerConfig.options?.excludeOperations

  return {
    onPluginInit(context) {
      context.registerContextErrorHandler(({ error }) => {
        if (error) {
          childLogger.error(`Error building context. ${error}`)
        }
      })
    },
    onExecute({ args }) {
      const options = {} as any
      const rootOperation = args.document.definitions.find(
        (o) => o.kind === Kind.OPERATION_DEFINITION
      ) as OperationDefinitionNode

      const operationName =
        args.operationName || rootOperation.name?.value || 'Anonymous Operation'

      if (excludeOperations?.includes(operationName)) {
        return
      }

      if (includeOperationName) {
        options['operationName'] = operationName
      }

      if (includeQuery) {
        options['query'] = args.variableValues
      }

      if (includeRequestId) {
        options['requestId'] =
          args.contextValue.requestContext?.awsRequestId ||
          args.contextValue.event?.requestContext?.requestId ||
          uuidv4()
      }

      if (includeUserAgent) {
        options['userAgent'] = args.contextValue.event?.headers['user-agent']
      }

      const envelopLogger = childLogger.child({
        ...options,
      })

      envelopLogger.debug(`GraphQL execution started: ${operationName}`)
      const handleResult = logResult(loggerConfig, envelopLogger, operationName)

      return {
        onExecuteDone: (payload) => {
          handleStreamOrSingleExecutionResult(payload, ({ result }) => {
            handleResult({ result })
            return undefined
          })
        },
      }
    },
  }
}
