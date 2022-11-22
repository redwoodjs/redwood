export { checkSystemRequirements } from './checks'
export { setupHeroku } from './setup'
export { Logger } from './logger'
export * from './interfaces'

export const delay = (time: number) => {
  return new Promise((res) => {
    setTimeout(res, time)
  })
}
