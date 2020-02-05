// TODO: Determine what to do different during development, test, and production
// TODO: Get core js version
// TODO: Take a look at create-react-app. They've dropped a ton of knowledge.

const { getPaths } = require('@redwoodjs/core')

const CORE_JS_VERSION = '3.6.4'

module.exports = () => ({
  presets: ['@babel/preset-react', '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'babel-plugin-macros',
  ],
  overrides: [
    {
      test: './api/',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: '8.10.0',
            },
            useBuiltIns: 'usage',
            corejs: {
              version: CORE_JS_VERSION,
              proposals: true,
            },
          },
        ],
      ],
      plugins: [
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              src: getPaths().api.src,
            },
          },
        ],
        '@babel/plugin-proposal-optional-chaining',
      ],
    },
    {
      test: './web',
      presets: [
        [
          '@babel/preset-env',
          {
            // the targets are set in web/package.json
            useBuiltIns: 'usage',
            corejs: {
              version: CORE_JS_VERSION,
              proposals: true,
            },
          },
        ],
      ],
      plugins: [
        '@babel/plugin-transform-runtime',
        [
          'babel-plugin-module-resolver',
          {
            alias: {
              src: './src',
            },
          },
        ],
      ],
    },
  ],
})
