/* eslint-env node */
// @ts-check

const rootConfig = require('../prettier.config')

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  ...rootConfig,
  trailingComma: 'es5',
}

module.exports = config
