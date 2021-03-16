import { BaseLogger, LoggerOptions } from 'pino'
import split from 'split2'

import { createLogger, defaultLoggerOptions } from '../logger'

const once = (emitter, name) => {
  return new Promise((resolve, reject) => {
    if (name !== 'error') {
      emitter.once('error', reject)
    }
    emitter.once(name, (...args) => {
      emitter.removeListener('error', reject)
      resolve(...args)
    })
  })
}

const sink = () => {
  const result = split((data) => {
    try {
      return JSON.parse(data)
    } catch (err) {
      console.log(err)
      console.log(data)
    }
  })

  return result
}

const setupLogger = (
  loggerOptions?: LoggerOptions
): {
  logger: BaseLogger
  logSinkData: Promise<unknown>
} => {
  const stream = sink()
  const logSinkData = once(stream, 'data')

  const logger = createLogger({
    options: { ...defaultLoggerOptions, ...loggerOptions, prettyPrint: false },
    destination: stream,
    showConfig: false,
  })

  return { logger, logSinkData }
}

describe('logger', () => {
  describe('supports various logging levels', () => {
    test('it logs a trace message', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.trace('test of a trace level message')
      const logStatement = await logSinkData

      expect(logStatement).toHaveProperty('level')
      expect(logStatement).toHaveProperty('time')
      expect(logStatement).toHaveProperty('msg')

      expect(logStatement['level']).toEqual(10)
      expect(logStatement['msg']).toEqual('test of a trace level message')
    })

    test('it logs an info message', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.info('test of an info level message')
      const logStatement = await logSinkData

      expect(logStatement).toHaveProperty('level')
      expect(logStatement).toHaveProperty('time')
      expect(logStatement).toHaveProperty('msg')

      expect(logStatement['level']).toEqual(30)
      expect(logStatement['msg']).toEqual('test of an info level message')
    })

    test('it logs a debug message', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.debug('test of a debug level message')
      const logStatement = await logSinkData

      expect(logStatement).toHaveProperty('level')
      expect(logStatement).toHaveProperty('time')
      expect(logStatement).toHaveProperty('msg')

      expect(logStatement['level']).toEqual(20)
      expect(logStatement['msg']).toEqual('test of a debug level message')
    })

    test('it logs a warning message', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.warn('test of a warning level message')
      const logStatement = await logSinkData

      expect(logStatement).toHaveProperty('level')
      expect(logStatement).toHaveProperty('time')
      expect(logStatement).toHaveProperty('msg')

      expect(logStatement['level']).toEqual(40)
      expect(logStatement['msg']).toEqual('test of a warning level message')
    })

    test('it logs an error message', async () => {
      const { logger, logSinkData } = setupLogger()

      const error = Object.assign(new Error('TestError'), {
        message: 'something unexpected happened',
      })
      logger.error({ message: error.message }, 'test of an error level message')
      const logStatement = await logSinkData

      expect(logStatement).toHaveProperty('level')
      expect(logStatement).toHaveProperty('time')
      expect(logStatement).toHaveProperty('msg')
      expect(logStatement).toHaveProperty('log')
      expect(logStatement['log']).toHaveProperty('message')

      expect(logStatement['level']).toEqual(50)
      expect(logStatement['msg']).toEqual('test of an error level message')
      expect(logStatement['log']['message']).toEqual(
        'something unexpected happened'
      )
    })
  })

  describe('supports key redaction', () => {
    test('it redact the value of a given key', async () => {
      const { logger, logSinkData } = setupLogger({
        redact: ['log.redactedKey'],
      })

      logger.info({ redactedKey: 'you cannot see me' }, 'test of a redaction')
      const logStatement = await logSinkData

      expect(logStatement['msg']).toEqual('test of a redaction')

      expect(logStatement['log']).toHaveProperty('redactedKey')
      expect(logStatement['log']['redactedKey']).toEqual('[Redacted]')
    })
  })
})
