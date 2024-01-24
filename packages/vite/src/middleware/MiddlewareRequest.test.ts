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
    console.log(`👉 \n ~ mReq:`, mReq)

    expect(mReq.cookies.get('foo')).toStrictEqual({ value: 'bar' })
    expect(mReq.method).toStrictEqual('POST')
    expect(mReq.headers.get('Content-Type')).toStrictEqual('application/json')
  })
})
