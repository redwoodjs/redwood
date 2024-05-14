import { AsyncLocalStorage } from 'async_hooks'

import type { ServerAuthState } from '@redwoodjs/auth'

import { CookieJar } from './middleware/CookieJar.js'

export interface ServerStore extends Map<string, any> {}

let PER_REQ_STORAGE: AsyncLocalStorage<ServerStore>

// Should be called on every server request, forces a creation of a new store
export const initServerStore = (req: Request) => {
  console.log('Initializing server store.....')
  PER_REQ_STORAGE = new AsyncLocalStorage<ServerStore>()

  // @TODO Unsure whether we should do .run or .enterWith
  /**
   * See description from node docs:
   * This transition will continue for the entire synchronous execution.
   * This means that if, for example, the context is entered within an event handler subsequent
   * event handlers will also run within that context unless specifically bound
   * to another context with an AsyncResource.
   *
   * That is why run() should be preferred over enterWith() unless there are strong reasons
   * to use the latter method.
   *
   * It sounds like the behaviour they're warning about might be _desired_ behaviour
   *
   */

  const reqStore = new Map()
  reqStore.set('headers', req.headers)

  PER_REQ_STORAGE.enterWith(reqStore)

  return PER_REQ_STORAGE.getStore()
}

/***
 * This should only be called from the worker
 * Name this better. Eventually this will only be called in DEV.
 */
export const initStoreForWorker__ONLYCALLFROMWORKER = (
  headerInit: HeadersInit,
  serverAuthState: any,
) => {
  console.log('Initializing WORKER store.....')
  PER_REQ_STORAGE = new AsyncLocalStorage<ServerStore>()

  const reqStore = new Map()
  const headers = new Headers(headerInit)
  reqStore.set('headers', headers)
  reqStore.set('serverAuthState', serverAuthState)

  PER_REQ_STORAGE.enterWith(reqStore)

  return PER_REQ_STORAGE.getStore()
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

// @TODO: can we set headers + cookies from RSC component? We'll have to get server store and do something with it in the RSC handler
// and also in createStreamingHandler

// @TODO add guard rails around headers and cookies object?
// Because you can't modify
