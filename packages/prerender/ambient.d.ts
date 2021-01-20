export {}
declare global {
  namespace NodeJS {
    interface Global {
      __REDWOOD__PRERENDERING: boolean
    }
  }
}
