/* eslint-disable no-undef */
// The value is read from `redwood.toml`
// @ts-expect-error This is replaced at build time by Webpack Define Plugin.
if (typeof __REDWOOD__API_PROXY_PATH !== 'undefined') {
  // @ts-expect-error-next-line
  global.__REDWOOD__API_PROXY_PATH = __REDWOOD__API_PROXY_PATH
}
// @ts-expect-error-next-line
global.__REDWOOD__APP_TITLE = __REDWOOD__APP_TITLE
