/* eslint-disable react-hooks/rules-of-hooks */

// AWS Lambda run each request in a new process,
// a process is not reused until a request is completed.
//
// Which means that each `global.context` is scoped to the lifetime of each request.
// This makes it safe to use the global context for Redwood Functions.

// However when not in AWS Lambda, NodeJS is single-threaded, you must use the
// per-request global context, otherwise you risk a race-condition
// where one request overwrites another's global context.
//
// Alternatively only use the local `context` in a graphql resolver.

import { AsyncLocalStorage } from 'async_hooks'

export interface GlobalContext extends Record<string, unknown> {}

let GLOBAL_CONTEXT: GlobalContext = {}
let PER_REQUEST_CONTEXT: AsyncLocalStorage<Map<string, GlobalContext>>

export const shouldUseLocalStorageContext = () =>
  process.env.DISABLE_CONTEXT_ISOLATION !== '1'

/**
 * This returns a AsyncLocalStorage instance, not the actual store
 */
export const getAsyncStoreInstance = () => {
  if (!PER_REQUEST_CONTEXT) {
    PER_REQUEST_CONTEXT = new AsyncLocalStorage()
  }
  return PER_REQUEST_CONTEXT as AsyncLocalStorage<Map<string, GlobalContext>>
}

export const createContextProxy = () => {
  if (shouldUseLocalStorageContext()) {
    return new Proxy<GlobalContext>(GLOBAL_CONTEXT, {
      get: (_target, property: string) => {
        const store = getAsyncStoreInstance().getStore()
        const ctx = store?.get('context') || {}
        return ctx[property]
      },
    })
  } else {
    return GLOBAL_CONTEXT
  }
}

export let context: GlobalContext = createContextProxy()

/**
 * Set the contents of the global context object.
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  GLOBAL_CONTEXT = newContext
  if (shouldUseLocalStorageContext()) {
    // re-init the proxy against GLOBAL_CONTEXT,
    // so things like `console.log(context)` is the actual object,
    // not one initialized earlier.
    context = createContextProxy()
    const store = getAsyncStoreInstance().getStore()
    store?.set('context', GLOBAL_CONTEXT)
  } else {
    context = GLOBAL_CONTEXT
  }
  return context
}
