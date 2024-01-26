import { Response as PonyfillResponse } from '@whatwg-node/fetch'
import { describe, expect, test } from 'vitest'

import { MiddlewareResponse } from './MiddlewareResponse'

describe('MiddlewareResponse', () => {
  test('Can build a Web API Response object', () => {
    const res = new MiddlewareResponse().toResponse()
    expect(res instanceof PonyfillResponse).toBe(true)
    expect(res.status).toStrictEqual(200)
    expect(res.ok).toStrictEqual(true)
  })

  test('Can attach headers to response', () => {
    const mwRes = MiddlewareResponse.next()
    mwRes.headers.set('X-Custom-Header', 'sweet')
    mwRes.headers.append('Other-header', 'sweeter')

    const builtResponse = mwRes.toResponse()

    expect(builtResponse.headers.get('X-Custom-Header')).toStrictEqual('sweet')
    expect(builtResponse.headers.get('Other-header')).toStrictEqual('sweeter')
  })

  test('Can attach a cookie with CookieJar', () => {
    const mwRes = MiddlewareResponse.next()
    mwRes.cookies.set('token', 'hunter2', {
      domain: 'redwoodjs.com',
      path: '/',
      httpOnly: true,
    })

    mwRes.cookies.set('monster', 'nomnomnom', {
      domain: 'redwoodjs.com',
    })

    const builtResponse = mwRes.toResponse()

    expect(builtResponse.headers.getSetCookie()).toStrictEqual([
      'token=hunter2; Domain=redwoodjs.com; Path=/; HttpOnly',
      'monster=nomnomnom; Domain=redwoodjs.com',
    ])
  })

  test('Constructs redirects correctly', () => {
    const tempRedirect = MiddlewareResponse.redirect('/somewhere')
    expect(tempRedirect.isRedirect()).toStrictEqual(true)
    expect(tempRedirect.toResponse().status).toStrictEqual(302)
  })
})
