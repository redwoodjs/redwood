export {}
declare global {
  namespace NodeJS {
    interface Global {
      __REDWOOD_PRERENDER_MODE: boolean
    }
  }
}
