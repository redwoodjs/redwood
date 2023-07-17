/* eslint-disable react-hooks/rules-of-hooks */

console.log('-> globalContextStore (real) [MODULE]')

import { AsyncLocalStorage } from 'async_hooks'

import type { GlobalContext } from './globalContext'

let CONTEXT_STORAGE: AsyncLocalStorage<Map<string, GlobalContext>>

/**
 * This returns a AsyncLocalStorage instance, not the actual store
 */
export const getAsyncStoreInstance = () => {
  console.log('-> getAsyncStoreInstance (real)')
  if (!CONTEXT_STORAGE) {
    CONTEXT_STORAGE = new AsyncLocalStorage<Map<string, GlobalContext>>()
  }
  return CONTEXT_STORAGE as AsyncLocalStorage<Map<string, GlobalContext>>
}
