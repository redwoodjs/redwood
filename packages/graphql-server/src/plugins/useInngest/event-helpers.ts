import jsonStableStringify from 'fast-json-stable-stringify'
import fastRedact from 'fast-redact'
import pkg from 'humps'

import { hashSHA256 } from './hash-sha256'
import {
  USE_INNGEST_DEFAULT_EVENT_PREFIX,
  USE_INNGEST_ANONYMOUS_EVENT_PREFIX,
} from './plugin'
import { getOperationInfo, buildTypeIdentifiers } from './schema-helpers'
import type {
  UseInngestDataOptions,
  UseInngestEventOptions,
  UseInngestUserContextOptions,
  BuildEventNameFunction,
  UseInngestEventNameFunctionOptions,
  BuildEventNamePrefixFunction,
  BuildUserContextFunction,
  UseInngestEventNamePrefixFunctionOptions,
} from './types'

const { decamelize } = pkg

/**
 * buildOperationId
 *
 * Builds a unique operation ID from the document, operation name, and variables.
 *
 * Used to generate an anonymous operation name for events.
 *
 * @param options UseInngestDataEventOptions
 * @returns string Operation ID
 */
export const buildOperationId = async (
  options: UseInngestEventOptions
): Promise<string> => {
  const tokens = [
    options.documentString,
    getOperationInfo(options).operationName ?? '',
    jsonStableStringify(options.params.args.variableValues ?? {}),
  ].join('|')

  const operationId = await hashSHA256(tokens)

  return operationId
}

/**
 * buildOperationNameForEventName
 *
 * Builds an operation name for an event based on the convention:
 *
 * <prefix>-<operationId>.<operationType>
 *
 * For example:
 *
 * graphql/test-query.query
 *
 * @param options UseInngestDataEventOptions
 * @returns string Operation name for event
 */
export const buildOperationNameForEventName = async (
  options: UseInngestEventOptions
) => {
  let { operationName } = getOperationInfo(options)

  if (!operationName) {
    const operationId = await buildOperationId(options)
    operationName = `${USE_INNGEST_ANONYMOUS_EVENT_PREFIX}-${operationId}`
  }

  return decamelize(operationName, {
    separator: '-',
  })
}

/**
 * buildEventPayload
 *
 * Builds the event payload for an event.
 * Redacts result data and variables if redactRawResultOptions is provided.
 *
 * @param options UseInngestDataOptions
 * @returns Object Event payload
 */
export const buildEventPayload = async (options: UseInngestDataOptions) => {
  const { identifiers, types } = await buildTypeIdentifiers(options)

  let variables = options.params.args.variableValues || {}
  let result = {}

  if (options.includeRawResult) {
    result = options.result
  }

  if (options.redactRawResultOptions) {
    const redact = fastRedact(options.redactRawResultOptions)
    result = JSON.parse(redact(result) as string)
    variables = JSON.parse(redact(variables) as string)
  }

  const { operationName, operationType } = getOperationInfo(options)

  const payload = {
    variables,
    identifiers,
    types,
    result,
    operation: {
      id: await buildOperationNameForEventName(options),
      name: operationName || '',
      type: operationType,
    },
  }

  return payload
}

/**
 * buildEventNamePrefix
 *
 * Custom function to build the event name prefix.
 *
 * @param options UseInngestEventNamePrefixFunctionOptions
 * @returns string Prefix for event name
 */
export const buildEventNamePrefix: BuildEventNamePrefixFunction = async (
  _options: UseInngestEventNamePrefixFunctionOptions
) => {
  return USE_INNGEST_DEFAULT_EVENT_PREFIX
}

/**
 * buildEventName
 *
 * Custom function to build the event name.
 *
 * @param options UseInngestEventNameFunctionOptions
 * @returns string Event name
 */
export const buildEventName: BuildEventNameFunction = async (
  options: UseInngestEventNameFunctionOptions
) => {
  const operationName = await buildOperationNameForEventName(options)
  const { operationType } = getOperationInfo(options)

  const name =
    `${options.eventNamePrefix}/${operationName}.${operationType}`.toLowerCase()

  return name as string
}

/**
 * buildUserContext
 *
 * Custom function to build the user context.
 *
 * @param options UseInngestUserContextOptions
 * @returns Object User info
 */
export const buildUserContext: BuildUserContextFunction = (
  _options: UseInngestUserContextOptions
) => {
  return {}
}
