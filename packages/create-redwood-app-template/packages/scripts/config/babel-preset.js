/**
 * This is the babel preset used `create-redwood-app`
 */

// TODO: Determine what to do different during development, test, and production
// TODO: Take a look at create-react-app. They've dropped a ton of knowledge.

const { getPaths } = require('@redwoodjs/core')

const TARGETS_NODE = '8.10.0'
// https://github.com/zloirock/core-js/blob/master/README.md#babelpreset-env
// Warning! Recommended to specify used minor core-js version, like corejs: '3.6',
// instead of corejs: 3, since with corejs: 3 will not be injected modules which
// were added in minor core-js releases.
const CORE_JS_VERSION = '3.6'

module.exports = () => ({
  presets: ['@babel/preset-react', '@babel/typescript'],
  plugins: [
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    'babel-plugin-macros',
    [
      '@babel/plugin-transform-runtime',
      {
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#core-js-aliasing
        // Setting the version here also requires `@babel/runtime-corejs3`
        corejs: { version: 3, proposals: true },
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime/#version
        // Transform-runtime assumes that @babel/runtime@7.0.0 is installed.
        // Specifying the version can result in a smaller bundle size.
        // TODO: Grab version for package.json
        version: '^7.8.3',
      },
    ],
  ],
  overrides: [
    // ** API **
    {
      test: './api/',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: TARGETS_NODE,
            },
            useBuiltIns: 'usage',
            corejs: {
              version: CORE_JS_VERSION,
              // List of supported proposals: https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#ecmascript-proposals
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
      ],
    },
    // ** WEB **
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
