/* eslint-disable react-hooks/rules-of-hooks */

import { AsyncLocalStorage } from 'async_hooks'

export interface GlobalContext extends Record<string, unknown> {}

// TODO: Why isn't this defined here as a const?
let CONTEXT_STORAGE: AsyncLocalStorage<Map<string, GlobalContext>>

/**
 * This returns a AsyncLocalStorage instance, not the actual store
 */
export const getAsyncStoreInstance = () => {
  if (!CONTEXT_STORAGE) {
    CONTEXT_STORAGE = new AsyncLocalStorage<Map<string, GlobalContext>>()
  }
  return CONTEXT_STORAGE as AsyncLocalStorage<Map<string, GlobalContext>>
}

export const createContextProxy = (target: GlobalContext) => {
  return new Proxy<GlobalContext>(target, {
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

export let context: GlobalContext = createContextProxy({})

/**
 * Set the contents of the global context object.
 *
 * This completely replaces the existing context values such as currentUser.
 *
 * If you wish to extend the context simply use the `context` object directly,
 * such as `context.magicNumber = 1`, or `setContext({ ...context, magicNumber: 1 })`
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  // re-init the proxy against the new context object,
  // so things like `console.log(context)` is the actual object,
  // not one initialized earlier.
  context = createContextProxy(newContext)

  // Replace the value of context stored in the current async store
  const store = getAsyncStoreInstance().getStore()
  store?.set('context', newContext)

  return context
}
