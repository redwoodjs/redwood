/* eslint-env node */
// @ts-check

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  bracketSpacing: true,
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: [
    'prettier-plugin-curly',
    'prettier-plugin-sh',
    'prettier-plugin-packagejson',
  ],
}

module.exports = config
