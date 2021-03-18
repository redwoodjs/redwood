import { PrismaClient, Prisma } from '@prisma/client'

import { logger } from './logger'

// To help you identify particularly slow parameter values,
// For example, Heroku outputs the slowest queries (that take 2 seconds or more)
const SLOW_QUERY_THRESHOLD = 2_000 // 2 seconds

/*
 * Determines the type and level of logging.
 *
 * See: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log
 */
export const defaultLogLevels: Prisma.LogLevel[] = ['info', 'warn', 'error']

/*
 * Generates the Prisma Log Definitions from log levels
 *
 * @return Prisma.LogDefinition[]
 */
export const prismaLoggerOptions = (
  setLogLevels: Prisma.LogLevel[]
): Prisma.LogDefinition[] => {
  return setLogLevels?.map((level) => {
    return { emit: 'event', level } as Prisma.LogDefinition
  })
}

/*
 * To use event-based logging:
 * Set emit to event for a specific log level, such as query
 * Use the $on() method to subscribe to the event
 *
 * https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging
 */
export const configureLogLevels = (
  client: PrismaClient,
  setLogLevels?: Prisma.LogLevel[]
) => {
  setLogLevels?.forEach((level) => {
    if (level === 'query') {
      client.$on(level, (queryEvent: Prisma.QueryEvent) => {
        if (queryEvent.duration >= SLOW_QUERY_THRESHOLD) {
          logger.warn(
            { ...queryEvent },
            `Slow Query performed in ${queryEvent.duration} msec`
          )
        } else {
          logger.debug(
            { ...queryEvent },
            `Query performed in ${queryEvent.duration} msec`
          )
        }
      })
    } else {
      client.$on(level, (logEvent: Prisma.LogEvent) => {
        switch (level) {
          case 'info':
            logger.info({ ...logEvent }, logEvent.message)
            break
          case 'warn':
            logger.warn({ ...logEvent }, logEvent.message)
            break
          case 'error':
            logger.error({ ...logEvent }, logEvent.message)
            break
          default:
            logger.info({ ...logEvent }, logEvent.message)
        }
      })
    }
  })

  return
}

/*
 * Generates the Prisma Log Definitions from log levels
 *
 * @return PrismaClient
 */
export const createPrismaClient = (setLogLevels?: Prisma.LogLevel[]) => {
  const client = new PrismaClient({
    log: prismaLoggerOptions(setLogLevels),
    errorFormat: 'colorless',
  })

  setLogLevels && configureLogLevels(client, setLogLevels)

  return client
}
