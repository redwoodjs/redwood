import {
  sendOperation,
  denySchemaCoordinate,
  denyType,
  isAnonymousOperation,
  isIntrospectionQuery,
} from './schema-helpers'
import { UseInngestDataOptions } from './types'

/**
 * shouldSendEvent
 *
 * Determines if an event should be sent to Inngest
 *
 * @param options UseInngestDataOptions
 * @returns boolean If event should be send
 */
export const shouldSendEvent = async (options: UseInngestDataOptions) => {
  const shouldSendOperation = sendOperation(options)
  const isAnonymous = isAnonymousOperation(options.params)
  const isIntrospection = isIntrospectionQuery(options.params)
  const hasErrors =
    options.result?.errors !== undefined && options.result.errors.length > 0
  const shouldDenyType = denyType(options)
  const shouldDenySchemaCoordinate = denySchemaCoordinate(options)

  if (!shouldSendOperation) {
    options.logger.warn(
      `Blocking event ${options.eventName} because it is not an configured operation.`
    )

    return false
  }

  if (shouldDenyType) {
    options.logger.warn(
      `Blocking event ${options.eventName} because it is present in the denylist of types.`
    )

    return false
  }

  if (shouldDenySchemaCoordinate) {
    options.logger.warn(
      `Blocking event ${options.eventName} because it is present in the denylist of schema coordinates.`
    )
    return false
  }

  if (isAnonymous && options.sendAnonymousOperations) {
    options.logger.warn(
      `Sending event ${options.eventName} because anonymous operations are configured.`
    )

    return true
  }

  if (isIntrospection && options.sendIntrospection) {
    options.logger.warn(
      `Sending event ${options.eventName} because introspection queries are configured.`
    )

    return true
  }

  if (hasErrors && options.sendErrors) {
    options.logger.warn(
      `Sending event ${options.eventName} because sending errors is configured.`
    )

    return true
  }

  const shouldSend = !isAnonymous && !isIntrospection && !hasErrors

  if (!shouldSend) {
    options.logger.warn(
      `Blocking event ${options.eventName} because it is not an introspection ${isIntrospection} or error ${hasErrors}`
    )
  }

  return shouldSend
}
