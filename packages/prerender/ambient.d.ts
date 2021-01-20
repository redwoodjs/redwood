export {}
declare global {
  namespace NodeJS {
    interface Global {
      __REDWOOD__PRERENDER_MODE: boolean
    }
  }
}
