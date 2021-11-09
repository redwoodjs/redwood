const Environment = require('jest-environment-jsdom')

/**
 *
 * This just adds TextEncoder and TextDecoder to the jsdom environment
 * to prevent errors when running tests parallely
 *
 */
module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup()

    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}
