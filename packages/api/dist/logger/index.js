"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.redactionsList = exports.logLevel = exports.isTest = exports.isProduction = exports.isDevelopment = exports.handlePrismaLogging = exports.emitLogLevels = exports.defaultLoggerOptions = exports.defaultLogLevels = exports.createLogger = void 0;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _pino = _interopRequireDefault(require("pino"));
/**
 * Types from Pino
 * @see https://github.com/pinojs/pino/blob/master/pino.d.ts
 */

// @TODO use type from Prisma once the issue is solved
// https://github.com/prisma/prisma/issues/8291

/**
 * Determines if log environment is development
 *
 * @type {boolean}
 *
 */
const isDevelopment = exports.isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Determines if log environment is test
 *
 * @type {boolean}
 *
 */
const isTest = exports.isTest = process.env.NODE_ENV === 'test';

/**
 * Determines if log environment is production by checking if not development
 *
 * @type {boolean}
 *
 */
const isProduction = exports.isProduction = !isDevelopment && !isTest;

/*
 * List of keys to redact from log
 *
 * As an array, the redact option specifies paths that should have their values redacted from any log output.
 *
 */
const redactionsList = exports.redactionsList = ['access_token', 'data.access_token', 'data.*.access_token', 'data.*.accessToken', 'accessToken', 'data.accessToken', 'DATABASE_URL', 'data.*.email', 'data.email', 'email', 'event.headers.authorization', 'data.hashedPassword', 'data.*.hashedPassword', 'hashedPassword', 'host', 'jwt', 'data.jwt', 'data.*.jwt', 'JWT', 'data.JWT', 'data.*.JWT', 'password', 'data.password', 'data.*.password', 'params', 'data.salt', 'data.*.salt', 'salt', 'secret', 'data.secret', 'data.*.secret'];

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
const logLevel = exports.logLevel = (() => {
  if (typeof process.env.LOG_LEVEL !== 'undefined') {
    return process.env.LOG_LEVEL;
  } else if (isProduction) {
    return 'warn';
  } else if (isTest) {
    return 'silent';
  } else {
    return 'trace';
  }
})();

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
const defaultLoggerOptions = exports.defaultLoggerOptions = {
  level: logLevel,
  redact: redactionsList
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
const createLogger = ({
  options,
  destination,
  showConfig = false
}) => {
  const hasDestination = typeof destination !== 'undefined';
  const isFile = hasDestination && typeof destination === 'string';
  const isStream = hasDestination && !isFile;
  const stream = destination;
  options = {
    ...defaultLoggerOptions,
    ...options
  };
  if (showConfig) {
    console.log('Logger Configuration');
    console.log(`isProduction: ${isProduction}`);
    console.log(`isDevelopment: ${isDevelopment}`);
    console.log(`isTest: ${isTest}`);
    console.log(`isFile: ${isFile}`);
    console.log(`isStream: ${isStream}`);
    console.log(`logLevel: ${logLevel}`);
    console.log(`options: ${(0, _stringify.default)(options, null, 2)}`);
    console.log(`destination: ${destination}`);
  }
  if (isFile) {
    if (isProduction) {
      console.warn('Please make certain that file system access is available when logging to a file in a production environment.');
    }
    return (0, _pino.default)(options, stream);
  } else {
    if (isStream && isDevelopment && !isTest) {
      console.warn('Logs will be sent to the transport stream in the current development environment.');
    }
    return (0, _pino.default)(options, stream);
  }
};

/**
 * To help you identify particularly slow parameter values,
 * For example, Heroku outputs the slowest queries (that take 2 seconds or more)
 **/
exports.createLogger = createLogger;
const DEFAULT_SLOW_QUERY_THRESHOLD = 2_000; // 2 seconds

/**
 * Determines the type and level of logging.
 *
 * @see {@link https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#log}
 */
const defaultLogLevels = exports.defaultLogLevels = ['info', 'warn', 'error'];

/**
 * Generates the Prisma Log Definitions for the Prisma Client to emit
 *
 * @return Prisma.LogDefinition[]
 */
const emitLogLevels = setLogLevels => {
  return setLogLevels?.map(level => {
    return {
      emit: 'event',
      level
    };
  });
};

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
exports.emitLogLevels = emitLogLevels;
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
const handlePrismaLogging = config => {
  const logger = config.logger.child({
    // @TODO Change this once this issue is resolved
    // See https://github.com/prisma/prisma/issues/8290
    prisma: {
      clientVersion: config.db['_clientVersion']
    }
  });
  const slowQueryThreshold = config.slowQueryThreshold ?? DEFAULT_SLOW_QUERY_THRESHOLD;
  config.logLevels?.forEach(level => {
    if (level === 'query') {
      config.db.$on(level, event => {
        const queryEvent = event;
        if (queryEvent.duration >= slowQueryThreshold) {
          logger.warn({
            ...queryEvent
          }, `Slow Query performed in ${queryEvent.duration} msec`);
        } else {
          logger.debug({
            ...queryEvent
          }, `Query performed in ${queryEvent.duration} msec`);
        }
      });
    } else {
      config.db.$on(level, event => {
        const logEvent = event;
        switch (level) {
          case 'info':
            logger.info({
              ...logEvent
            }, logEvent.message);
            break;
          case 'warn':
            logger.warn({
              ...logEvent
            }, logEvent.message);
            break;
          case 'error':
            logger.error({
              ...logEvent
            }, logEvent.message);
            break;
          default:
            logger.info({
              ...logEvent
            }, logEvent.message);
        }
      });
    }
  });
  return;
};
exports.handlePrismaLogging = handlePrismaLogging;