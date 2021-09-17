/* eslint-disable no-var */

declare global {
  var __REDWOOD__PRERENDERING: boolean

  namespace NodeJS {
    interface Global {
      /**
       * This global is set to true by the prerendering CLI command.
       */
      __REDWOOD__PRERENDERING: boolean
    }
  }
}

export {}
