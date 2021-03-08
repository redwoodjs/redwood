import pino, {
  BaseLogger,
  DestinationStream,
  LevelWithSilent,
  LoggerOptions,
  redactOptions,
} from 'pino'

/**
 * Determines if log environment is development or test
 *
 * @type {boolean}
 *
 */
const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'

/**
 * Determines if log environment is production by checking if not development
 *
 * @type {boolean}
 *
 */
const isProduction = !isDevelopment

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
 * Its function logging output readability can benefeit from pretty-printing.
 */
export const isPretty = isDevelopment

/**
 * Defines the necessary pretty printing dependency
 */
export const prettifier = require('pino-pretty')

/*
 * List of keys to redact from log
 *
 * As an array, the redact option specifies paths that should have their values redacted from any log output.
 *
 * Each path must be a string using a syntax which corresponds to JavaScript dot and bracket notation.
 *
 * If an object is supplied, three options can be specified:
 *
 *      paths (String[]): Required. An array of paths
 *      censor (String): Optional. A value to overwrite key which are to be redacted. Default: '[Redacted]'
 *      remove (Boolean): Optional. Instead of censoring the value, remove both the key and the value. Default: false
 */
export const redactionsList: string[] | redactOptions = [
  'host',
  'email',
  'accessToken',
  'access_token',
  'secret',
]

/**
 * Determines if log level based on envars and
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
 */
export const logLevel: LevelWithSilent | string = (() => {
  if (typeof process.env.LOG_LEVEL !== 'undefined') {
    return process.env.LOG_LEVEL
  } else if (isProduction) {
    return 'warn'
  } else {
    return 'trace'
  }
})()

/**
 * Defines an opinionated base logger configuration that defines
 * how to log and what to ignore.
 *
 * Defaults are:
 *
 * * Colorize output
 * * Ingore some event attributes like hostname
 * * Prefix the log output with log level
 * * Use a shorted log message that omits server name
 * * Humanize time in GMT
 * * Set the default log level in dev or test to trace and warn in prod *or set via LOG_LEVEL)
 * * Nest objects under an `api` key to avoid conflicts with pino properties
 * * Redact the host
 *
 * See: https://github.com/pinojs/pino/blob/master/docs/api.md
 *      https://github.com/pinojs/pino-pretty
 */

export const defaultLoggerOptions: LoggerOptions = {
  prettyPrint: isPretty && {
    colorize: true,
    ignore: 'hostname,pid',
    levelFirst: true,
    messageFormat: false,
    translateTime: true,
  },
  prettifier: isPretty && prettifier,
  level: logLevel,
  nestedKey: 'log',
  redact: redactionsList,
}

/**
 * RedwoodLoggerOptions
 * Defines custom logger options that extend those available in LoggerOptions
 * and can define a destination like a file or other supported pin log transport stream
 *
 * @typedef {Object} RedwoodLoggerOptions
 * @extends LoggerOptions
 * @property {options} LoggerOptions - options define how to log
 * @property {string | DestinationStream} destination - destination defines where to log
 * @property {boolean} showConfig - Display logger configuration on initialization
 */
export interface RedwoodLoggerOptions {
  options: LoggerOptions
  destination?: string | DestinationStream
  showConfig?: boolean
}

/**
 * Creates the logger
 *
 * @param {RedwoodLoggerOptions} options, destination - The logger configuration options and destination
 * @return {BaseLogger} - The configured logger
 *
 * @example
 *
 *    createLogger({ options: { level: 'error' } })
 */
export const createLogger = ({
  options,
  destination,
  showConfig = isDevelopment,
}: RedwoodLoggerOptions): BaseLogger => {
  const hasDestination = typeof destination !== 'undefined'
  const isFile = hasDestination && typeof destination === 'string'
  const isStream = hasDestination && !isFile
  const stream = destination

  if (showConfig) {
    // @todo remove in release
    // Currently for debug and sanity checking
    console.log('Logger Configuration')
    console.log(`isProduction: ${isProduction}`)
    console.log(`isDevelopment: ${isDevelopment}`)
    console.log(`isPretty: ${isPretty}`)
    console.log(`isFile: ${isFile}`)
    console.log(`isStream: ${isStream}`)
    console.log(`logLevel: ${logLevel}`)
    console.log(`options: ${JSON.stringify(options, null, 2)}`)
    console.log(`destination: ${destination}`)
  }

  if (isFile) {
    if (!isDevelopment) {
      console.warn(
        'Please make certain that file system access is available when logging to a file in a non-development environment.'
      )
    }

    return pino(options, stream as DestinationStream)
  } else {
    if (isStream && isDevelopment) {
      console.warn(
        'Logs will be sent to the transport stream in the current development environment.'
      )
    }

    if (isStream && options.prettyPrint) {
      console.warn(
        'Logs sent to the transport stream are being prettified. This format may be incompatible.'
      )
    }

    return pino(options, stream as DestinationStream)
  }
}
