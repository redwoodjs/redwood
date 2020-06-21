export interface GlobalContext {
  [key: string]: any
}

export let context: GlobalContext = {}

/**
 * Replace the existing global context.
 */
export const setContext = (newContext: GlobalContext): GlobalContext => {
  context = newContext
  return context
}
