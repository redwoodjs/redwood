const Environment = require('jest-environment-jsdom')

// Due to issue: https://github.com/jsdom/jsdom/issues/2524
// Fix from: https://github.com/jsdom/jsdom/issues/2524#issuecomment-736672511
module.exports = class RedwoodWebJestEnv extends Environment {
  async setup() {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}
