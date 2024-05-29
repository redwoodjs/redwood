import { Request as ArdaRequest } from '@whatwg-node/fetch'
import { describe, expect, test } from 'vitest'

import { createMiddlewareRequest } from './MiddlewareRequest'

describe('MiddlewareRequest', () => {
  test('Converts a Web API Request object correctly', () => {
    const req = new Request('http://redwoodjs.com', {
      method: 'POST',
      body: JSON.stringify({
        hello: 'world',
      }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'foo=bar',
        'X-Custom-Header': 'sweet',
      },
    })
    const mReq = createMiddlewareRequest(req)

    expect(mReq.cookies.get('foo')).toStrictEqual('bar')
    expect(mReq.method).toStrictEqual('POST')
    expect(mReq.headers.get('Content-Type')).toStrictEqual('application/json')

    // note the lower case header name
    expect(mReq.headers.get('x-custom-header')).toStrictEqual('sweet')
  })

  test('Converts whatwg-node/fetch Request correctly', () => {
    const whatWgRequest = new ArdaRequest(
      'https://github.com/ardatan/whatwg-node',
      {
        method: 'PUT',
        body: JSON.stringify({
          hello: 'world',
        }),
        headers: {
          Cookie: 'errybody=lets-funk',
          'X-Custom-Header': 'beatdrop',
        },
      },
    )

    const mReq = createMiddlewareRequest(whatWgRequest)

    expect(mReq.cookies.get('errybody')).toStrictEqual('lets-funk')
    expect(mReq.method).toStrictEqual('PUT')

    expect(mReq.headers.get('x-custom-header')).toStrictEqual('beatdrop')
  })

  test('Can attach and retrieve server auth context', () => {
    const req = new Request('http://redwoodjs.com')
    const FAKE_AUTH_CONTEXT = {
      currentUser: {
        name: 'Danny',
      },
      isAuthenticated: true,
    }
    const mReq = createMiddlewareRequest(req)

    mReq.serverAuthState.set(FAKE_AUTH_CONTEXT)

    expect(mReq.serverAuthState.get()).toStrictEqual(FAKE_AUTH_CONTEXT)
  })
})
