import { formatCacheKey } from '../index'

describe('formatCacheKey', () => {
  it('creates a key from a string', () => {
    expect(formatCacheKey('foobar')).toEqual('foobar')
    expect(formatCacheKey('foo-bar')).toEqual('foo-bar')
  })

  it('creates a key from an array', () => {
    expect(formatCacheKey(['foo'])).toEqual('foo')
    expect(formatCacheKey(['foo', 'bar'])).toEqual('foo-bar')
  })

  it('appends a prefix', () => {
    expect(formatCacheKey('bar', 'foo')).toEqual('foo-bar')
    expect(formatCacheKey(['bar'], 'foo')).toEqual('foo-bar')
    expect(formatCacheKey(['bar', 'baz'], 'foo')).toEqual('foo-bar-baz')
  })

  it('does not appent the prefix more than once', () => {
    expect(formatCacheKey('foo-bar', 'foo')).toEqual('foo-bar')
    expect(formatCacheKey(['foo', 'bar'], 'foo')).toEqual('foo-bar')
  })
})
