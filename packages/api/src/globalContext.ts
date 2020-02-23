export let context = {}

export const setContext = (newContext: {
  [funcName: string]: any
}): { [funcName: string]: any } => {
  context = newContext
  return context
}
