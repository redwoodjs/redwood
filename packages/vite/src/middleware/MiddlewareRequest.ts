import { Request as WhatWgRequest } from '@whatwg-node/fetch'

import {
  middlewareDefaultAuthProviderState,
  type ServerAuthState,
} from '@redwoodjs/auth'

import { CookieJar } from './CookieJar.js'

class AuthStateJar {
  private _data: ServerAuthState
  private _initialState: ServerAuthState

  constructor(initialState: ServerAuthState) {
    this._data = initialState
    this._initialState = initialState
  }

  get() {
    return this._data
  }

  set(value: ServerAuthState) {
    this._data = value
  }

  clear() {
    this._data = this._initialState
  }
}

export class MiddlewareRequest extends WhatWgRequest {
  cookies: CookieJar
  serverAuthState: AuthStateJar

  constructor(input: Request) {
    super(input)

    const defaultServerAuthState = {
      ...middlewareDefaultAuthProviderState,
      cookieHeader: input.headers.get('Cookie'),
      roles: [],
    }

    this.cookies = new CookieJar(input.headers.get('Cookie'))
    this.serverAuthState = new AuthStateJar(defaultServerAuthState)
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
