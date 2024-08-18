import type P from 'pino';
/**
 * Types from Pino
 * @see https://github.com/pinojs/pino/blob/master/pino.d.ts
 */
export type Logger = P.Logger;
export type BaseLogger = P.BaseLogger;
export type DestinationStream = P.DestinationStream;
export type LevelWithSilent = P.LevelWithSilent;
export type LoggerOptions = P.LoggerOptions;
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
type PrismaClient = any;
type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
/**
 * Determines if log environment is development
 *
 * @type {boolean}
 *
 */
export declare const isDevelopment: boolean;
/**
 * Determines if log environment is test
 *
 * @type {boolean}
 *
 */
export declare const isTest: boolean;
/**
 * Determines if log environment is production by checking if not development
 *
 * @type {boolean}
 *
 */
export declare const isProduction: boolean;
export declare const redactionsList: string[];
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
export declare const logLevel: LevelWithSilent | string;
/**
 * Defines an opinionated base logger configuration that defines
 * how to log and what to ignore.
 *
 * @default logger options are:
 *
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
 * @see {@link https://github.com/pinojs/pino/blob/master/docs/api.md}
 */
export declare const defaultLoggerOptions: {
    level: string;
    redact: string[];
};
/**
 * RedwoodLoggerOptions defines custom logger options that extend those available in LoggerOptions
 * and can define a destination like a file or other supported pin log transport stream
 *
 * @typedef {Object} RedwoodLoggerOptions
 * @extends LoggerOptions
 * @property {options} LoggerOptions - options define how to log
 * @property {string | DestinationStream} destination - destination defines where to log
 * @property {boolean} showConfig - Display logger configuration on initialization
 */
export interface RedwoodLoggerOptions {
    options?: LoggerOptions;
    destination?: string | DestinationStream;
    showConfig?: boolean;
}
/**
 * Creates the logger
 *
 * @param options {RedwoodLoggerOptions} - Override the default logger configuration
 * @param destination {DestinationStream} - An optional destination stream
 * @param showConfig {Boolean} - Show the logger configuration. This is off by default.
 *
 * @example
 * // Create the logger to log just at the error level
 * createLogger({ options: { level: 'error' } })
 *
 * @example
 * // Create the logger to log to a file
 * createLogger({ destination: { 'var/logs/redwood-api.log' } })
 *
 * @return {Logger} - The configured logger
 */
export declare const createLogger: ({ options, destination, showConfig, }: RedwoodLoggerOptions) => Logger;
/**
 * Determines the type and level of logging.
 *
 * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log}
 */
export declare const defaultLogLevels: LogLevel[];
/**
 * Generates the Prisma Log Definitions for the Prisma Client to emit
 *
 * @return Prisma.LogDefinition[]
 */
export declare const emitLogLevels: (setLogLevels: LogLevel[]) => LogDefinition[];
/**
 * Defines what is needed to setup Prisma Client logging used in handlePrismaLogging
 *
 *
 * @param db {PrismaClient} - The Prisma Client instance
 * @param logger {BaseLogger} - The Redwood logger instance
 * @param logLevels {LogLevel[]} - The log levels . Should match those set with emitLogLevels
 * @param slowQueryThreshold {number} - The threshold for slow queries. Default: 2 seconds
 *
 * @see emitLogLevels
 *
 */
interface PrismaLoggingConfig {
    db: PrismaClient;
    logger: Logger;
    logLevels: LogLevel[];
    slowQueryThreshold?: number;
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
 *  slowQueryThreshold: 2000,
 * })
 *
 * @return {void}
 *
 */
export declare const handlePrismaLogging: (config: PrismaLoggingConfig) => void;
export {};
//# sourceMappingURL=index.d.ts.map