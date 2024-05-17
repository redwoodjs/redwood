import { Request as WhatWgRequest } from '@whatwg-node/fetch'

import {
  middlewareDefaultAuthProviderState,
  type ServerAuthState,
} from '@redwoodjs/auth'

import { CookieJar } from './CookieJar.js'

class ServerAuthJar<T> {
  private _data: T

  constructor(data?: T) {
    this._data = data as T
  }

  get() {
    return this._data
  }

  set(value: any) {
    this._data = value
  }
}

export class MiddlewareRequest extends WhatWgRequest {
  cookies: CookieJar
  serverAuthState: ServerAuthJar<ServerAuthState>

  constructor(input: Request) {
    super(input)
    this.cookies = new CookieJar(input.headers.get('Cookie'))
    this.serverAuthState = new ServerAuthJar(middlewareDefaultAuthProviderState)
  }
}

/**
 * Converts a Web API Request object to a MiddlewareRequest object.
 * Also ensures that serverAuthState is fresh for each request
 * (assuming that it is a new instance for each request)
 */
export const createMiddlewareRequest = (req: Request) => {
  const middlewareRequest = new MiddlewareRequest(req)
  return middlewareRequest
}
