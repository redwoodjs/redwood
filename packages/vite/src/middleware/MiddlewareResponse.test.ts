import { describe, expect, test } from 'vitest'

import { MiddlewareResponse } from './MiddlewareResponse'

describe('MiddlewareResponse', () => {
  test('Can build a Web API Response object', () => {
    const res = MiddlewareResponse.next().build()
    expect(res.constructor.name).toStrictEqual('Response')
    expect(res.status).toStrictEqual(200)
    expect(res.ok).toStrictEqual(true)
  })

  test('Can attach headers to response', () => {
    const mwRes = MiddlewareResponse.next()
    mwRes.headers.set('X-Custom-Header', 'sweet')
    mwRes.headers.append('Other-header', 'sweeter')

    const builtResponse = mwRes.build()

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

    const builtResponse = mwRes.build()

    expect(builtResponse.headers.get('Set-Cookie')).toStrictEqual(
      'token=hunter2; Domain=redwoodjs.com; Path=/; HttpOnly'
    )
  })
})
