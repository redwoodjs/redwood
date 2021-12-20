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
  })
})
