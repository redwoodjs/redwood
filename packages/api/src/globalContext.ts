export interface Context {
  [name: string]: any
}

export let context = {}

/**
 * Replace the existing global context.
 */
export const setContext = (newContext: Context): Context => {
  context = newContext
  return context
}
