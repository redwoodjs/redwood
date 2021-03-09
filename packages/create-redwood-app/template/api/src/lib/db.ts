// See https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/constructor
// for options.

import { PrismaClient, Prisma } from '@prisma/client'

import { logger } from './logger'

// To help you identify particularly slow parameter values,
// For example, Heroku outputs the slowest queries (that take 2 seconds or more)
const SLOW_QUERY_THRESHOLD = 2 * 1000 // 2 seconds

/*
 * Determines the type and level of logging.
 *
 * See: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log
 */
const logLevels: Prisma.LogLevel[] = ['info', 'warn', 'error'] // add 'query' in dev?

/*
 * Generates the Prisma Log Definitions from log levels
 *
 * @return Prisma.LogDefinition[]
 */
const prismaLoggerOptions = (
  logLevels: Prisma.LogLevel[]
): Prisma.LogDefinition[] => {
  return logLevels?.map((level) => {
    return { emit: 'event', level } as Prisma.LogDefinition
  })
}

/*
 * Generates the Prisma Log Definitions from log levels
 *
 * @return PrismaClient
 */
const createPrismaClient = (logLevels: Prisma.LogLevel[]) => {
  const client = new PrismaClient({
    log: prismaLoggerOptions(logLevels),
    errorFormat: 'colorless',
  })

  /*
   * To use event-based logging:
   * Set emit to event for a specific log level, such as query
   * Use the $on() method to subscribe to the event
   *
   * https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging
   */

  logLevels.forEach((level) => {
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
        logger.info({ ...logEvent }, logEvent.message)
      })
    }
  })

  return client
}

/*
 * Instance of the Prisma Client
 */
export const db = createPrismaClient(logLevels)
