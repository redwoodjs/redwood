// AWS Lambda run each request in a new process,
// a process is not reused until a request is completed.
//
// Which means that each `global.context` is scoped to the lifetime of each request.

// However when not in AWS Lambda, NodeJS is single-threaded, you must use the
// per-request global context, otherwise you risk a race-condition
// where one request overwrites another's global context.
//
// Alternatively only use the local `context` in a graphql resolver.

export interface GlobalContext {
  [key: string]: unknown
}

import { AsyncLocalStorage } from 'async_hooks'

export let asyncLocalStorage:
  | AsyncLocalStorage<Map<string, GlobalContext>>
  | undefined = undefined
export const initGlobalContext = () => {
  if (process.env.SAFE_GLOBAL_CONTEXT !== '1') {
    asyncLocalStorage = new AsyncLocalStorage()
    return asyncLocalStorage
  }
  return undefined
}

let GLOBAL_CONTEXT: GlobalContext = {}
export const context = new Proxy<GlobalContext>(GLOBAL_CONTEXT, {
  get: (_target, property: string) => {
    if (process.env.SAFE_GLOBAL_CONTEXT === '1') {
      return GLOBAL_CONTEXT[property]
    } else {
      const store = asyncLocalStorage?.getStore()
      if (!store) {
        throw new Error(
          'Async local storage is not initialized. Call `initGlobalContext` before attempting to read from the store.'
        )
      }
      return store.get('context')?.[property]
    }
  },
})

/**
 * Replace the existing global context.
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  if (process.env.SAFE_GLOBAL_CONTEXT === '1') {
    GLOBAL_CONTEXT = newContext
  } else {
    const store = asyncLocalStorage?.getStore()
    if (!store) {
      throw new Error(
        'Async local storage is not initialized. Call `initGlobalContext` before attempting to read from the store.'
      )
    }
    store.set('context', newContext)
  }

  return newContext
}
