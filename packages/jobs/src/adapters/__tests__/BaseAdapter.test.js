import * as errors from '../../core/errors'
import { BaseAdapter } from '../BaseAdapter'

describe('constructor', () => {
  test('initializing the adapter saves options', () => {
    const adapter = new BaseAdapter({ foo: 'bar' })

    expect(adapter.options.foo).toEqual('bar')
  })

  test('creates a separate instance var for any logger', () => {
    const mockLogger = jest.fn()
    const adapter = new BaseAdapter({ foo: 'bar', logger: mockLogger })

    expect(adapter.logger).toEqual(mockLogger)
  })
})

describe('schedule()', () => {
  test('throws an error if not implemented', () => {
    const adapter = new BaseAdapter({})

    expect(() => adapter.schedule()).toThrow(errors.NotImplementedError)
  })
})

describe('find()', () => {
  test('throws an error if not implemented', () => {
    const adapter = new BaseAdapter({})

    expect(() => adapter.find()).toThrow(errors.NotImplementedError)
  })
})

describe('success()', () => {
  test('throws an error if not implemented', () => {
    const adapter = new BaseAdapter({})

    expect(() => adapter.success()).toThrow(errors.NotImplementedError)
  })
})

describe('failure()', () => {
  test('throws an error if not implemented', () => {
    const adapter = new BaseAdapter({})

    expect(() => adapter.failure()).toThrow(errors.NotImplementedError)
  })
})
