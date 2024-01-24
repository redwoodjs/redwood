import { CookieJar } from './CookieJar'

class ContextJar {
  private _data = {}

  get() {
    return this._data
  }

  set(value: any) {
    this._data = value
  }
}

class MiddlewareRequest extends Request {
  cookies: CookieJar
  serverAuthContext: ContextJar

  constructor(input: Request) {
    super(input)
    this.cookies = new CookieJar(this.headers.get('Cookie'))
    this.serverAuthContext = new ContextJar()
  }
}

/**
 * Converts a Web API Request object to a MiddlewareRequest object
 * also ensures that serverAuthContext is fresh for each request
 * (assuming that it is a new instance for each request)
 */
export const createMiddlewareRequest = (req: Request) => {
  const middlewareRequest = new MiddlewareRequest(req)
  return middlewareRequest
}
