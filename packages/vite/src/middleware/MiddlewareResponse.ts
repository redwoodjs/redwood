import { Response as PonyResponse } from '@whatwg-node/fetch'
import cookie from 'cookie'

import { CookieJar } from './CookieJar.js'

/**
 * This is actually a Response builder class
 * After setting all the required proeprties, we can call `build` to get a Web API Response object
 */
export class MiddlewareResponse {
  cookies = new CookieJar()
  headers = new Headers()
  body: BodyInit | null | undefined
  status = 200

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    this.body = body
    this.headers = new Headers(init?.headers)
    this.status = init?.status || 200
  }

  static fromResponse = (res: Response) => {
    return new MiddlewareResponse(res.body, {
      headers: res.headers,
      status: res.status,
    })
  }

  static shortCircuit = ({
    body,
    status = 200,
  }: {
    body: BodyInit
    status?: number
  }) => {
    return new MiddlewareResponse(body, { status: status })
  }

  static next = () => {
    return new MiddlewareResponse()
  }

  static redirect = (
    location: string,
    type: 'permanent' | 'temporary' = 'temporary',
  ) => {
    const res = new MiddlewareResponse()
    res.headers.set('Location', location)
    res.status = type === 'permanent' ? 301 : 302

    return res
  }

  isRedirect = () => {
    return this.status === 301 || this.status === 302
  }

  toResponse = () => {
    for (const [ckName, ckParams] of this.cookies) {
      this.headers.append(
        'Set-Cookie',
        cookie.serialize(ckName, ckParams.value, ckParams.options),
      )
    }

    return new PonyResponse(this.body, {
      headers: this.headers,
      status: this.status,
    })
  }
}
