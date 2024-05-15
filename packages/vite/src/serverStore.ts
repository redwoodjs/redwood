import { AsyncLocalStorage } from 'async_hooks'

import type { ServerAuthState } from '@redwoodjs/auth'

import { CookieJar } from './middleware/CookieJar.js'

export interface ServerStore extends Map<string, any> {}

let PER_REQ_STORAGE: AsyncLocalStorage<ServerStore>

type InitPerReqMapParams = {
  headers: Headers | Record<string, string>
  serverAuthState?: ServerAuthState
}

export const createServerStorage = () => {
  PER_REQ_STORAGE = new AsyncLocalStorage<ServerStore>()

  return PER_REQ_STORAGE
}

/**
 *
 * This function just creates a Map, that you pass to
 * serverStorage.run(MAP_HERE, () => { ... })
 */
export const createPerRequestMap = ({
  headers,
  serverAuthState,
}: InitPerReqMapParams) => {
  const reqStore = new Map()

  const headersObj = new Headers(headers)
  reqStore.set('headers', headersObj)

  if (serverAuthState) {
    reqStore.set('serverAuthState', serverAuthState)
  }

  return reqStore
}

const getStore = () => {
  if (!PER_REQ_STORAGE) {
    throw new Error('Server store not initialized')
  }

  return PER_REQ_STORAGE.getStore()
}

export const getRequestCookies = (): CookieJar => {
  const headers = getRequestHeaders()

  return new CookieJar(headers.get('cookie'))
}

export const getRequestHeaders = (): Headers => {
  return getStore()?.get('headers')
}

export const getAuthState = (): ServerAuthState => {
  return getStore()?.get('serverAuthState')
}

export const setServerAuthState = (authState: ServerAuthState) => {
  const store = getStore()
  store?.set('serverAuthState', authState)
}

// @TODO: should we allow setting headers + cookies from RSC component? We'll have to get server store and do something with it in the RSC handler
// and also in createStreamingHandler

// @TODO add guard rails around headers and cookies object? If you CANT set it form RSC
// Because you can't modify request headers
