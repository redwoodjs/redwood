export {
  doesHaveHeroku as checkHerokuInstalled,
  checkSystemRequirements,
} from './checks'
export { setupHeroku } from './install'

export const delay = (time: number) => {
  return new Promise((res) => {
    setTimeout(res, time)
  })
}
