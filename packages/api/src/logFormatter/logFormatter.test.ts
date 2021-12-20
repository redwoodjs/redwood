import { LogFormatter } from './index'

const logFormatter = LogFormatter()

describe('LogFormatter', () => {
  describe('Formats log levels as emoji', () => {
    test('Formats Trace level', () => {
      expect(logFormatter({ level: 10 })).toMatch(/🔍/)
    })

    test('Formats Debug level', () => {
      expect(logFormatter({ level: 20 })).toMatch(/🐛/)
    })

    test('Formats Info level', () => {
      expect(logFormatter({ level: 30 })).toMatch(/🌲/)
    })

    test('Formats Warn level', () => {
      expect(logFormatter({ level: 40 })).toMatch(/⚠️/)
    })

    test('Formats Error level', () => {
      expect(logFormatter({ level: 50 })).toMatch(/🚨/)
    })
  })

  describe('Formats log messages', () => {
    test('Formats newline-delimited json data with a message', () => {
      expect(
        logFormatter({ level: 10, message: 'Message in a bottle' })
      ).toMatch(/Message in a bottle/)
    })

    test('Formats newline-delimited json data with a msg', () => {
      expect(logFormatter({ level: 10, msg: 'Message in a bottle' })).toMatch(
        /Message in a bottle/
      )
    })

    test('Formats a text message', () => {
      expect(logFormatter('Handles text data')).toMatch(/Handles text data/)
    })

    test('Formats Get Method and Status Code', () => {
      expect(
        logFormatter({ level: 10, method: 'GET', statusCode: 200 })
      ).toMatch(/GET 200/)
    })

    test('Formats Post Method and Status Code', () => {
      expect(
        logFormatter({ level: 10, method: 'POST', statusCode: 200 })
      ).toMatch(/POST 200/)
    })

    test('Should not format Status Code without a Method', () => {
      expect(logFormatter({ level: 10, statusCode: 200 })).not.toMatch(/200/)
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
      ).toMatch(/\"id\": 1/)
    })

    test('Handles operation name', () => {
      expect(
        logFormatter({ level: 10, operationName: 'GET_BLOG_POST_BY_ID' })
      ).toMatch(/GET_BLOG_POST_BY_ID/)
    })

    test('Handles GraphQL data', () => {
      expect(
        logFormatter({
          level: 10,
          data: { post: { id: 1, title: 'My Blog Post' } },
        })
      ).toMatch(/My Blog Post/)
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
      ).not.toMatch(/I should not see this/)
    })
  })
})
