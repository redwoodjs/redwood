import type {
  UseInngestPluginOptions,
  UseInngestLogger,
  UseInngestLogLevel,
} from './types.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */

const ansiCodes = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
} as const

export const warnPrefix = ansiCodes.yellow + 'WARN' + ansiCodes.reset
export const infoPrefix = ansiCodes.cyan + 'INFO' + ansiCodes.reset
export const errorPrefix = ansiCodes.red + 'ERR' + ansiCodes.reset
export const debugPrefix = ansiCodes.magenta + 'DEBUG' + ansiCodes.reset
export const tracePrefix = ansiCodes.cyan + 'TRACE' + ansiCodes.reset

const logLevelScores: Record<UseInngestLogLevel | 'silent', number> = {
  trace: 0,
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

const consoleLog =
  (prefix: string) =>
  (...args: Array<any>) =>
    console.log(prefix, ...args)

const traceLog = console.info
  ? (...args: Array<any>) => console.info(tracePrefix, ...args)
  : consoleLog(tracePrefix)
const debugLog = console.debug
  ? (...args: Array<any>) => console.debug(debugPrefix, ...args)
  : consoleLog(debugPrefix)
const infoLog = console.info
  ? (...args: Array<any>) => console.info(infoPrefix, ...args)
  : consoleLog(infoPrefix)
const warnLog = console.warn
  ? (...args: Array<any>) => console.warn(warnPrefix, ...args)
  : consoleLog(warnPrefix)
const errorLog = console.error
  ? (...args: Array<any>) => console.error(errorPrefix, ...args)
  : consoleLog(errorPrefix)

const createLogger = (
  logLevel: UseInngestLogLevel | 'silent' = globalThis.process?.env.DEBUG ===
  '1'
    ? 'debug'
    : 'info'
) => {
  const score = logLevelScores[logLevel]
  return {
    trace: score > logLevelScores.trace ? noop : traceLog,
    debug: score > logLevelScores.debug ? noop : debugLog,
    info: score > logLevelScores.info ? noop : infoLog,
    warn: score > logLevelScores.warn ? noop : warnLog,
    error: score > logLevelScores.error ? noop : errorLog,
  }
}

/**
 * buildLogger
 *
 * Builds a logger
 *
 * @param options Pick<UseInngestPluginOptions, 'logging'>
 * @returns UseInngestLogger
 */
export const buildLogger = (
  options: Pick<UseInngestPluginOptions, 'logging'>
): UseInngestLogger => {
  const logging = options?.logging != null ? options.logging : true

  return typeof logging === 'boolean'
    ? logging === true
      ? createLogger()
      : createLogger('silent')
    : typeof logging === 'string'
    ? createLogger(logging)
    : logging
}
