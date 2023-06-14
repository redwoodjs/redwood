/* eslint-disable react-hooks/rules-of-hooks */

import { AsyncLocalStorage } from 'async_hooks'

export interface GlobalContext extends Record<string, unknown> {}

let GLOBAL_CONTEXT: GlobalContext = {}
let CONTEXT_STORAGE: AsyncLocalStorage<Map<string, GlobalContext>>

/**
 * This returns a AsyncLocalStorage instance, not the actual store
 */
export const getAsyncStoreInstance = () => {
  if (!CONTEXT_STORAGE) {
    CONTEXT_STORAGE = new AsyncLocalStorage()
  }
  return CONTEXT_STORAGE as AsyncLocalStorage<Map<string, GlobalContext>>
}

export const createContextProxy = () => {
  return new Proxy<GlobalContext>(GLOBAL_CONTEXT, {
    get: (_target, property: string) => {
      const store = getAsyncStoreInstance().getStore()
      const ctx = store?.get('context') || {}
      return ctx[property]
    },
    set: (_target, property: string, newVal) => {
      const store = getAsyncStoreInstance().getStore()
      const ctx = store?.get('context') || {}
      ctx[property] = newVal
      store?.set('context', ctx)
      return true
    },
  })
}

export let context: GlobalContext = createContextProxy()

/**
 * Set the contents of the global context object.
 *
 * This completely replaces the existing context values such as currentUser.
 *
 * If you wish to extend the context simply use the `context` object directly,
 * such as `context.magicNumber = 1`, or `setContext({ ...context, magicNumber: 1 })`
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  GLOBAL_CONTEXT = newContext
  context = createContextProxy()
  const store = getAsyncStoreInstance().getStore()
  store?.set('context', GLOBAL_CONTEXT)
  return context
}
