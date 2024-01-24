import cookie from 'cookie'

import { CookieJar } from './CookieJar'

/**
 * This is actually a Response builder class
 * After setting all the required proeprties, we can call `build` to get a Web API Response object
 */
export class MiddlewareResponse {
  cookies = new CookieJar()
  headers = new Headers()
  body: BodyInit | undefined
  status = 200

  static next = () => {
    return new MiddlewareResponse()
  }

  static redirect = (
    location: string,
    type: 'permanent' | 'temporary' = 'temporary'
  ) => {
    const res = new MiddlewareResponse()
    res.headers.set('Location', location)
    res.status = type === 'permanent' ? 301 : 302

    return res
  }

  build = () => {
    for (const [ckName, ckParams] of this.cookies) {
      this.headers.append(
        'Set-Cookie',
        cookie.serialize(ckName, ckParams.value, ckParams.options)
      )
    }

    return new Response(this.body, {
      headers: this.headers,
      status: this.status,
    })
  }
}
