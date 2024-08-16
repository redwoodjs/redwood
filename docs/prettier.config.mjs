import rootConfig from '../prettier.config.mjs'

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  ...rootConfig,
  trailingComma: 'es5',
}

export default config
