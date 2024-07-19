// Copied from packages/testing/config/jest/web/RedwoodWebJestEnv.js
// See that file for further information
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util')
  global.TextEncoder = TextEncoder
  global.TextDecoder = TextDecoder
}
