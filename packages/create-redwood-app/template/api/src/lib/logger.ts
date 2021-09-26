import { createLogger } from '@redwoodjs/api/logger'

/**
 * Creates a logger with RedwoodLoggerOptions
 *
 * These extend and override default LoggerOptions,
 * can define targets like a file or other supported pino log transport stream,
 * and sets whether or not to show the logger configuration settings (defaults to false)
 *
 * @param RedwoodLoggerOptions
 *
 * RedwoodLoggerOptions have
 * @param {options} LoggerOptions - defines how to log, such as pretty printing, redaction, and format
 * @param {array} targets - defines where to log, such as a transport stream or file
 * @param {boolean} showConfig - whether to display logger configuration on initialization
 *
 * @example
 * // Create the logger to log with pino-pretty to STDOUT just at the info level
 * createLogger({ targets: [{
 *    level: 'info',
 *    target: 'pino-pretty', // must be installed separately
 *    options: { destination: 1 },
 *  }]
 * })
 *
 **/

export const logger = createLogger({})
