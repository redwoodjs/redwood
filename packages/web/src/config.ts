/* eslint-disable no-undef */
// The value is read from `redwood.toml`
if (typeof __REDWOOD__API_PROXY_PATH !== 'undefined') {
  global.__REDWOOD__API_PROXY_PATH = __REDWOOD__API_PROXY_PATH
}
global.__REDWOOD__APP_TITLE = __REDWOOD__APP_TITLE
