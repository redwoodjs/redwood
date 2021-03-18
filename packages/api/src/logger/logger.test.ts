import { BaseLogger, LoggerOptions } from 'pino'
import split from 'split2'

import { createLogger } from '../logger'

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
    options: { ...loggerOptions, prettyPrint: false },
    destination: stream,
    showConfig: false,
  })

  return { logger, logSinkData }
}

describe('logger', () => {
  describe('creates a logger without options', () => {
    test('it logs a trace message', async () => {
      const logger = createLogger({})

      expect(logger).toBeDefined()
    })
  })

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
      expect(logStatement).toHaveProperty('message')

      expect(logStatement['level']).toEqual(50)
      expect(logStatement['msg']).toEqual('test of an error level message')
      expect(logStatement['message']).toEqual('something unexpected happened')
    })
  })

  describe('supports key redaction', () => {
    test('it redacts defaults header authorization', async () => {
      const { logger, logSinkData } = setupLogger({
        redact: ['event.headers.authorization'],
      })
      const event = {
        event: { headers: { authorization: 'Bearer access_token' } },
      }

      logger.info(event, 'test of an access token')
      const logStatement = await logSinkData
      expect(logStatement['msg']).toEqual('test of an access token')

      expect(logStatement).toHaveProperty('event')
      expect(logStatement['event']['headers']['authorization']).toEqual(
        '[Redacted]'
      )
    })

    test('it redacts the value of a given key', async () => {
      const { logger, logSinkData } = setupLogger({
        redact: ['redactedKey'],
      })

      logger.info({ redactedKey: 'you cannot see me' }, 'test of a redaction')
      const logStatement = await logSinkData
      expect(logStatement['msg']).toEqual('test of a redaction')

      expect(logStatement).toHaveProperty('redactedKey')
      expect(logStatement['redactedKey']).toEqual('[Redacted]')
    })

    test('it redacts a JWT token key by default', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.info(
        {
          jwt:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
        'test of a redacted JWT'
      )
      const logStatement = await logSinkData
      expect(logStatement['msg']).toEqual('test of a redacted JWT')

      expect(logStatement).toHaveProperty('jwt')
      expect(logStatement['jwt']).toEqual('[Redacted]')
    })

    test('it redacts a password key by default', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.info(
        {
          password: '123456',
        },
        'test of a redacted password'
      )
      const logStatement = await logSinkData
      expect(logStatement['msg']).toEqual('test of a redacted password')

      expect(logStatement).toHaveProperty('password')
      expect(logStatement['password']).toEqual('[Redacted]')
    })

    test('it redacts the email key by default', async () => {
      const { logger, logSinkData } = setupLogger()

      logger.info(
        {
          email: 'alice@example.com',
        },
        'test of a redacted email'
      )
      const logStatement = await logSinkData
      expect(logStatement['msg']).toEqual('test of a redacted email')

      expect(logStatement).toHaveProperty('email')
      expect(logStatement['email']).toEqual('[Redacted]')
    })
  })
})
