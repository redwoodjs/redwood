import { LogFormatter } from '../logFormatter/index'

const logFormatter = LogFormatter()

describe('LogFormatter', () => {
  describe('Formats log levels as emoji', () => {
    test('Formats Trace level', () => {
      expect(logFormatter({ level: 10 })).toMatch('🧵')
    })

    test('Formats Debug level', () => {
      expect(logFormatter({ level: 20 })).toMatch('🐛')
    })

    test('Formats Info level', () => {
      expect(logFormatter({ level: 30 })).toMatch('🌲')
    })

    test('Formats Warn level', () => {
      expect(logFormatter({ level: 40 })).toMatch('🚦')
    })

    test('Formats Error level', () => {
      expect(logFormatter({ level: 50 })).toMatch('🚨')
    })
  })

  describe('Formats log messages', () => {
    test('Formats newline-delimited json data with a message', () => {
      expect(
        logFormatter({ level: 10, message: 'Message in a bottle' })
      ).toMatch('Message in a bottle')
    })

    test('Formats newline-delimited json data with a msg', () => {
      expect(logFormatter({ level: 10, msg: 'Message in a bottle' })).toMatch(
        'Message in a bottle'
      )
    })

    test('Formats a text message', () => {
      expect(logFormatter('Handles text data')).toMatch('Handles text data')
    })

    test('Formats Get Method and Status Code', () => {
      const logData = { level: 10, method: 'GET', statusCode: 200 }
      expect(logFormatter(logData)).toMatch('GET')
      expect(logFormatter(logData)).toMatch('200')
    })

    test('Formats Post Method and Status Code', () => {
      const logData = { level: 10, method: 'POST', statusCode: 200 }
      expect(logFormatter(logData)).toMatch('POST')
      expect(logFormatter(logData)).toMatch('200')
    })

    test('Should not format Status Code without a Method', () => {
      expect(logFormatter({ level: 10, statusCode: 200 })).not.toMatch('200')
    })
  })

  describe('Formats GraphQL injected log data from useRedwoodLogger plugin', () => {
    test('Handles query', () => {
      expect(
        logFormatter({
          level: 10,
          query: {
            id: 1,
          },
        })
      ).toMatch('"id": 1')
    })

    test('Handles operation name', () => {
      expect(
        logFormatter({ level: 10, operationName: 'GET_BLOG_POST_BY_ID' })
      ).toMatch('GET_BLOG_POST_BY_ID')
    })

    test('Handles GraphQL data', () => {
      expect(
        logFormatter({
          level: 10,
          data: { post: { id: 1, title: 'My Blog Post' } },
        })
      ).toMatch('My Blog Post')
    })

    test('Handles browser user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15'
      expect(
        logFormatter({
          level: 10,
          userAgent,
        })
      ).toMatch(/Mozilla.*AppleWebKit.*Safari/)
    })
  })

  describe('Unknown log data', () => {
    test('Should not include an unknown log data attribute', () => {
      expect(
        logFormatter({
          level: 10,
          unknown: 'I should not see this',
        })
      ).not.toMatch('I should not see this')
    })
  })

  describe('Custom log data', () => {
    test('Should include the custom log attribute text', () => {
      expect(
        logFormatter({
          level: 10,
          custom: 'I should see this custom message text',
        })
      ).toMatch('I should see this')
    })

    test('Should include the custom log attribute info a custom emoji and label', () => {
      expect(
        logFormatter({
          level: 10,
          custom: 'I should see this custom emoji and label',
        })
      ).toMatch('🗒 Custom')
    })

    test('Should include the custom log attribute info with nested text message', () => {
      expect(
        logFormatter({
          level: 10,
          custom: {
            msg: 'I should see this custom message in the log',
          },
        })
      ).toMatch('I should see this custom message in the log')
    })
  })

  test('Should include the custom log attribute info with a number attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom message and number in the log',
          number: 100,
        },
      })
    ).toMatch('100')
  })

  test('Should include the custom log attribute info with a nested object attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom object in the log',
          obj: { foo: 'bar' },
        },
      })
    ).toMatch('"foo": "bar"')
  })

  test('Should include the custom log attribute info with a nested object attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom object in the log',
          obj: { foo: 'bar' },
        },
      })
    ).toMatch('"foo": "bar"')
  })

  test('Should format error stack traces', () => {
    expect(
      logFormatter({
        level: 50,
        err: {
          message: 'This error has a stack traces',
          stack:
            'A stack trace \n will have \n several lines \n at some line number \n at some code',
        },
      })
    ).toMatch(/at some line number/)
  })

  test('Should format error and include the error type', () => {
    expect(
      logFormatter({
        level: 50,
        err: {
          type: 'GraphQL Error',
          message: 'This error has a stack traces',
          stack:
            'A stack trace \n will have \n several lines \n at some line number \n at some code',
        },
      })
    ).toMatch(/GraphQL Error Info/)
  })
})
