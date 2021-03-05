/* eslint-disable react-hooks/rules-of-hooks */

// AWS Lambda run each request in a new process,
// a process is not reused until a request is completed.
//
// Which means that each `global.context` is scoped to the lifetime of each request.

// However when not in AWS Lambda, NodeJS is single-threaded, you must use the
// per-request global context, otherwise you risk a race-condition
// where one request overwrites another's global context.
//
// Alternatively only use the local `context` in a graphql resolver.

import { AsyncLocalStorage } from 'async_hooks'

export interface GlobalContext {
  [key: string]: unknown
}

let GLOBAL_CONTEXT: GlobalContext = {}
let PER_REQUEST_CONTEXT:
  | undefined
  | AsyncLocalStorage<Map<string, GlobalContext>> = undefined

export const usePerRequestContext = () =>
  process.env.SAFE_GLOBAL_CONTEXT !== '1'

export const initPerRequestContext = () => {
  GLOBAL_CONTEXT = {}
  PER_REQUEST_CONTEXT = new AsyncLocalStorage()
  return PER_REQUEST_CONTEXT
}

export const createContextProxy = () => {
  return new Proxy<GlobalContext>(GLOBAL_CONTEXT, {
    get: (_target, property: string) => {
      const store = PER_REQUEST_CONTEXT?.getStore()
      if (!store) {
        throw new Error(
          'Async local storage is not initialized. Call `initGlobalContext` before attempting to read from the store.'
        )
      }
      return store.get('context')?.[property]
    },
  })
}

export let context: GlobalContext = {}

/**
 * Replace the existing global context.
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  GLOBAL_CONTEXT = newContext

  if (usePerRequestContext()) {
    // re-init the proxy, so that calls to `console.log(context)`is the full object
    // not the one initilazed earlier.
    context = createContextProxy()
    const store = PER_REQUEST_CONTEXT?.getStore()
    if (!store) {
      throw new Error(
        'Per request context is not initialized, please use `initPerRequestContext`'
      )
    }
    store.set('context', GLOBAL_CONTEXT)
  } else {
    context = GLOBAL_CONTEXT
  }
  return context
}
