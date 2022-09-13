/* eslint-disable no-var */

declare global {
  /**
   * FQDN or absolute path to the DbAuth serverless function, without the trailing slash.
   * Example: `./redwood/functions/auth` or `https://api.redwoodjs.com/auth`
   **/
  var RWJS_API_DBAUTH_URL: string

  namespace NodeJS {
    interface Global {
      /** URL or absolute path to the DbAuth serverless function */
      RWJS_API_DBAUTH_URL: string
    }
  }
}

export {}
