import { Request as ArdaRequest } from '@whatwg-node/fetch'
import { describe, expect, test } from 'vitest'

import { createMiddlewareRequest } from './MiddlewareRequest'

describe('MiddlewareRequest', () => {
  test('Converts a Request object correctly', () => {
    const req = new Request('http://redwoodjs.com', {
      method: 'POST',
      body: JSON.stringify({
        hello: 'world',
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'foo=bar',
      },
    })
    const mReq = createMiddlewareRequest(req)

    expect(mReq.cookies.get('foo')).toStrictEqual({ value: 'bar' })
    expect(mReq.method).toStrictEqual('POST')
    expect(mReq.headers.get('Content-Type')).toStrictEqual('application/json')
  })

  test('Converts whatwg-node/fetch Request object correctly', () => {
    const req = new ArdaRequest('https://github.com/ardatan/whatwg-node', {
      method: 'PUT',
      body: JSON.stringify({
        hello: 'world',
      }),
      headers: {
        Cookie: 'everybody=lets-funk',
        'X-Custom-Header': 'beatdrop',
      },
    })
    const mReq = createMiddlewareRequest(req)

    expect(mReq.cookies.get('everybody')).toStrictEqual({ value: 'lets-funk' })
    expect(mReq.method).toStrictEqual('PUT')

    // note the lower case header name
    expect(mReq.headers.get('x-customer-header')).toStrictEqual('beatdrop')
  })
})
