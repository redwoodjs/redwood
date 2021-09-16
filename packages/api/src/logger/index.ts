import pino from 'pino'
import type P from 'pino'
import * as prettyPrint from 'pino-pretty'

// import { getPaths } from '@redwoodjs/internal' TODO: getPaths().api.lib to get the /absolute/path/to/my-transport.mjs or find a another way

export type LogLevel = 'info' | 'query' | 'warn' | 'error'

// @TODO use type from Prisma once the issue is solved
// https://github.com/prisma/prisma/issues/8291
type PrismaClient = any

type LogDefinition = {
  level: LogLevel
  emit: 'stdout' | 'event'
}

type QueryEvent = {
  timestamp: Date
  query: string
  params: string
  duration: number
  target: string
}

type LogEvent = {
  timestamp: Date
  message: string
  target: string
}

/**
 * Determines if log environment is development
 *
 * @type {boolean}
 *
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Determines if log environment is test
 *
 * @type {boolean}
 *
 */
export const isTest = process.env.NODE_ENV === 'test'

/**
 * Determines if log environment is production by checking if not development
 *
 * @type {boolean}
 *
 */
export const isProduction = !isDevelopment && !isTest

/**
 * Determines if logs should be prettified.
 *
 * Typically if logging to a transport stream or in production
 * logs will not be prettified.
 *
 * In fact, the pino developers note:
 * "We recommend against using pino-pretty in production,
 * and highly recommend installing pino-pretty as a development dependency."
 * See: https://github.com/pinojs/pino-pretty#programmatic-integration
 *
 * One exception to this rule may be Netlify functions logging.
 * Its function logging output readability can benefit from pretty-printing.
 */
export const isPretty = isDevelopment

/**
 * Defines the necessary pretty printing dependency
 */
export const prettifier = prettyPrint

/*
 * List of keys to redact from log
 *
 * As an array, the redact option specifies paths that should have their values redacted from any log output.
 *
 */
export const redactionsList: string[] = [
  'access_token',
  'data.access_token',
  'data.*.access_token',
  'data.*.accessToken',
  'accessToken',
  'data.accessToken',
  'DATABASE_URL',
  'data.*.email',
  'data.email',
  'email',
  'event.headers.authorization',
  'data.hashedPassword',
  'data.*.hashedPassword',
  'hashedPassword',
  'host',
  'jwt',
  'data.jwt',
  'data.*.jwt',
  'JWT',
  'data.JWT',
  'data.*.JWT',
  'password',
  'data.password',
  'data.*.password',
  'params',
  'data.salt',
  'data.*.salt',
  'salt',
  'secret',
  'data.secret',
  'data.*.secret',
]

/**
 * Determines if log level based on environment variables and
 * development or deployment environment defaults
 *
 * Set `LOG_LEVEL` env to the desired logging level. In order of priority, available levels are:
 *
 * - 'fatal'
 * - 'error'
 * - 'warn'
 * - 'info'
 * - 'debug'
 * - 'trace'
 *
 * The logging level is a __minimum__ level. For instance if `logger.level` is `'info'` then all `'fatal'`, `'error'`, `'warn'`,
 * and `'info'` logs will be enabled.
 *
 * You can pass `'silent'` to disable logging.
 *
 * @default 'warn' in Production
 * @default 'trace' in Development
 * @default 'silent' in Test
 *
 */
export const logLevel: P.LevelWithSilent | string = (() => {
  if (typeof process.env.LOG_LEVEL !== 'undefined') {
    return process.env.LOG_LEVEL
  } else if (isProduction) {
    return 'warn'
  } else if (isTest) {
    return 'silent'
  } else {
    return 'trace'
  }
})()

/**
 * Defines default options when pretty printing.
 * These can be overridden individually without losing other defaults.
 *
 * Defaults are:
 *
 * - Colorize output when pretty printing
 * - Ignore certain event attributes like hostname and pid for cleaner log statements
 * - Prefix the log output with log level
 * - Use a shorted log message that omits server name
 * - Humanize time in GMT
 * */
export const defaultPrettyPrintOptions: P.PrettyOptions = {
  colorize: true,
  ignore: 'hostname,pid',
  levelFirst: true,
  messageFormat: false,
  translateTime: true,
}

/**
 * Defines an opinionated base logger configuration that defines
 * how to log and what to ignore.
 *
 * @default logger options are:
 *
 * - Colorize output when pretty printing
 * - Ignore certain event attributes like hostname and pid for cleaner log statements
 * - Prefix the log output with log level
 * - Use a shorted log message that omits server name
 * - Humanize time in GMT
 * - Set the default log level in test to silent, development to trace
 *   and warn in prod
 *   Or set via LOG_LEVEL environment variable
 * - Redact the host and other keys via a set redactionList
 *
 * Each path must be a string using a syntax which corresponds to JavaScript dot and bracket notation.
 *
 * If an object is supplied, three options can be specified:
 *
 *      paths (String[]): Required. An array of paths
 *      censor (String): Optional. A value to overwrite key which are to be redacted. Default: '[Redacted]'
 *      remove (Boolean): Optional. Instead of censoring the value, remove both the key and the value. Default: false
 *
 * Pretty Printing Defaults defined in defaultPrettyPrintOptions
 *
 * @see {@link https://github.com/pinojs/pino/blob/master/docs/api.md}
 * @see {@link https://github.com/pinojs/pino-pretty}
 */
export const defaultLoggerOptions: P.LoggerOptions = {
  prettyPrint: isPretty && defaultPrettyPrintOptions,
  prettifier: isPretty && prettifier,
  level: logLevel,
  redact: redactionsList,
}

/**
 * RedwoodLoggerOptions defines custom logger options that extend those available in LoggerOptions
 * and can define a targets like a file or other supported pin log transport stream
 *
 * @typedef {Object} RedwoodLoggerOptions
 * @extends LoggerOptions
 * @property {options} LoggerOptions - options define how to log
 * @property {TransportTargetOptions<TransportOptions>[]} targets - targets defines where to log
 * @property {boolean} showConfig - Display logger configuration on initialization
 */
export interface TransportTargetOptions<
  TransportOptions = Record<string, any>
> {
  target: string
  options?: TransportOptions
  level?: P.LevelWithSilent
}
export interface RedwoodLoggerOptions<TransportOptions = Record<string, any>> {
  options?: P.LoggerOptions
  targets?: TransportTargetOptions<TransportOptions>[]
  showConfig?: boolean
}

/**
 * Creates the logger
 *
 * @param options {RedwoodLoggerOptions} - Override the default logger configuration
 * @param targets {TransportMultiOptions} - An optional Transports
 * @param showConfig {Boolean} - Show the logger configuration. This is off by default.
 *s
 * @example
 * // Create the logger to log just at the error level
 * createLogger({ options: { level: 'error' } })
 *
 * @example
 * // Create the logger to log to a file
 * createLogger({ targets: [{
      level: 'info',
      target: 'pino-pretty', // must be installed separately
    }]
  })
 *
 * @return {BaseLogger} - The configured logger
 */
export const createLogger = ({
  targets,
  options,
  showConfig = false,
}: RedwoodLoggerOptions): P.BaseLogger => {
  // TODO:
  // Add PrettyPrintOptions
  // Check if isFile
  // Keep config levels and redactions
  // Find a better default end that pretty

  if (showConfig) {
    console.log('Logger Configuration')
    console.log(`isProduction: ${isProduction}`)
    console.log(`isDevelopment: ${isDevelopment}`)
    console.log(`isTest: ${isTest}`)
    console.log(`isPretty: ${isPretty}`)
    console.log(`logLevel: ${logLevel}`)
    console.log(`options: ${JSON.stringify(options, null, 2)}`)
    console.log(`targets: ${targets}`)
  }
  if (isPretty) {
    const transport = pino.transport({
      target: 'pino-pretty',
      options: { destination: 1 }, // use 2 for stderr
    })
    pino(transport)
  } else {
    if (targets) {
      if (isDevelopment && !isTest) {
        console.warn(
          'Logs will be sent to the transport stream in the current development environment.'
        )
      }

      const transport = pino.transport({
        targets,
      })
      return pino(transport)
    }
  }
  const transport = pino.transport({
    target: 'pino-pretty',
    options: { destination: 1 }, // use 2 for stderr
  })
  return pino(transport)
}

/**
 * To help you identify particularly slow parameter values,
 * For example, Heroku outputs the slowest queries (that take 2 seconds or more)
 **/
const SLOW_QUERY_THRESHOLD = 2_000 // 2 seconds

/**
 * Determines the type and level of logging.
 *
 * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log}
 */
export const defaultLogLevels: LogLevel[] = ['info', 'warn', 'error']

/**
 * Generates the Prisma Log Definitions for the Prisma Client to emit
 *
 * @return Prisma.LogDefinition[]
 */
export const emitLogLevels = (setLogLevels: LogLevel[]): LogDefinition[] => {
  return setLogLevels?.map((level) => {
    return { emit: 'event', level } as LogDefinition
  })
}

/**
 * Defines what is needed to setup Prisma Client logging used in handlePrismaLogging
 *
 *
 * @param db {PrismaClient} - The Prisma Client instance
 * @param logger {BaseLogger} - The Redwood logger instance
 * @param logLevels {LogLevel[]} - The log levels . Should match those set with emitLogLevels
 *
 * @see emitLogLevels
 *
 */
interface PrismaLoggingConfig {
  db: PrismaClient
  logger: P.LoggerExtras
  logLevels: LogLevel[]
}

/**
 * Sets up event-based logging on the Prisma client
 *
 * Sets emit to event for a specific log level, such as query
 * using the $on() method to subscribe to the event
 *
 * @see {@link https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging}
 *
 * @param PrismaLoggingConfig
 *
 * @example
 *
 * handlePrismaLogging({
 *  db,
 *  logger,
 *  logLevels: ['info', 'warn', 'error'],
 * })
 *
 * @return {void}
 *
 */
export const handlePrismaLogging = (config: PrismaLoggingConfig): void => {
  const logger = config.logger.child({
    // @TODO Change this once this issue is resolved
    // See https://github.com/prisma/prisma/issues/8290
    prisma: { clientVersion: config.db['_clientVersion'] },
  })

  config.logLevels?.forEach((level) => {
    if (level === 'query') {
      config.db.$on(level, (event: any) => {
        const queryEvent = event as QueryEvent
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
      config.db.$on(level, (event: any) => {
        const logEvent = event as LogEvent
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
